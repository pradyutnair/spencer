import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { createGoCardlessClient } from '@/lib/gocardless';
import { getLoggedInUser } from '@/lib/user.actions';
import { Query, ID } from 'node-appwrite';
import { z } from 'zod';

// Validation schema
const RenewBankSchema = z.object({
  requisitionId: z.string().min(1, 'Requisition ID is required'),
  reason: z.enum(['expired', 'user_request', 'error', 'maintenance']).optional().default('user_request')
});

// Track renewal attempts
async function recordRenewalAttempt(userId: string, requisitionId: string, status: string, details?: any) {
  try {
    const { database } = await createAdminClient();
    await database.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_RENEWAL_LOG_COLLECTION_ID || 'renewal_logs',
      ID.unique(),
      {
        userId,
        requisitionId,
        status,
        details: JSON.stringify(details || {}),
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error recording renewal attempt:', error);
  }
}

// Validate requisition ownership and status
async function validateRequisition(userId: string, requisitionId: string) {
  const { database } = await createAdminClient();
  
  try {
    const requisitions = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('userId', userId),
        Query.equal('requisitionId', requisitionId),
        Query.limit(1)
      ]
    );

    if (requisitions.documents.length === 0) {
      return { valid: false, error: 'Requisition not found or not owned by user' };
    }

    const requisition = requisitions.documents[0];
    
    // Check if already in renewal process
    if (requisition.status === 'renewing') {
      return { 
        valid: false, 
        error: 'Renewal already in progress',
        existingRenewal: true
      };
    }

    return { 
      valid: true, 
      requisition: requisition,
      document: requisition
    };
  } catch (error) {
    console.error('Error validating requisition:', error);
    return { valid: false, error: 'Database error during validation' };
  }
}

// Create new bank connection for renewal
async function createRenewalConnection(institutionId: string, userId: string, origin: string) {
  try {
    const client = await createGoCardlessClient();
    await client.generateToken();

    const finalRedirectUrl = `${origin}/gocardless-renewal`;
    
    const sessionResult = await client.initSession({
      redirectUrl: finalRedirectUrl,
      institutionId: institutionId,
      referenceId: `renewal_${Date.now()}`,
      accessValidForDays: 90,
      maxHistoricalDays: 730
    });

    return { success: true, session: sessionResult };
  } catch (error: any) {
    console.error('Error creating renewal connection:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create renewal connection' 
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = RenewBankSchema.parse(body);
    const { requisitionId, reason } = validatedData;

    // Get current user
    const user = await getLoggedInUser();
    if (!user || !user.$id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Validate requisition
    const validation = await validateRequisition(user.$id, requisitionId);
    if (!validation.valid) {
      await recordRenewalAttempt(user.$id, requisitionId, 'validation_failed', {
        error: validation.error,
        reason: reason
      });
      
      return NextResponse.json({
        error: validation.error,
        ...(validation.existingRenewal && { 
          details: 'A renewal is already in progress for this bank connection' 
        })
      }, { status: validation.existingRenewal ? 409 : 404 });
    }

    const requisition = validation.requisition!;
    const requisitionDoc = validation.document!;

    // Get origin for redirect URL
    const origin = request.headers.get('origin') || 
                  process.env.APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

    if (!origin) {
      await recordRenewalAttempt(user.$id, requisitionId, 'error', { 
        error: 'No origin configured',
        reason: reason 
      });
      return NextResponse.json(
        { error: 'Application URL not configured. Please contact support.' }, 
        { status: 500 }
      );
    }

    // Mark requisition as renewing
    const { database } = await createAdminClient();
    try {
      await database.updateDocument(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_REQ_COLLECTION_ID!,
        requisitionDoc.$id,
        {
          status: 'renewing',
          renewalStartedAt: new Date().toISOString(),
          renewalReason: reason
        }
      );
    } catch (error) {
      console.error('Error marking requisition as renewing:', error);
      // Continue anyway as this is not critical
    }

    // Create new connection session
    const renewalResult = await createRenewalConnection(
      requisition.institutionId || requisition.bankName, // Fallback to bankName if institutionId not available
      user.$id,
      origin
    );

    if (!renewalResult.success) {
      // Revert status change
      try {
        await database.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_REQ_COLLECTION_ID!,
          requisitionDoc.$id,
          {
            status: requisition.status || 'active',
            renewalStartedAt: null,
            renewalReason: null
          }
        );
      } catch (error) {
        console.error('Error reverting requisition status:', error);
      }

      await recordRenewalAttempt(user.$id, requisitionId, 'connection_failed', {
        error: renewalResult.error,
        reason: reason
      });

      return NextResponse.json({
        error: 'Failed to create renewal connection',
        details: renewalResult.error,
        retryAfter: 300 // 5 minutes
      }, { status: 503 });
    }

    // Record successful renewal initiation
    await recordRenewalAttempt(user.$id, requisitionId, 'renewal_initiated', {
      newRequisitionId: renewalResult.session!.id,
      reason: reason,
      bankName: requisition.bankName
    });

    const processingTime = Date.now() - startTime;

    // Return success response
    return NextResponse.json({
      success: true,
      renewalLink: renewalResult.session!.link,
      newRequisitionId: renewalResult.session!.id,
      oldRequisitionId: requisitionId,
      bankName: requisition.bankName,
      instructions: {
        next: 'Follow the renewal link to re-authorize your bank connection',
        completion: 'You will be redirected back to complete the renewal process',
        timeout: 'This renewal link will expire in 1 hour'
      },
      metadata: {
        processingTime,
        reason: reason,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      }
    }, {
      headers: {
        'X-Processing-Time': processingTime.toString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        metadata: { processingTime }
      }, { status: 400 });
    }

    console.error('Bank renewal error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred during renewal. Please try again.',
      metadata: { processingTime }
    }, { status: 500 });
  }
}

// GET endpoint to check renewal status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const requisitionId = url.searchParams.get('requisitionId');
    
    if (!requisitionId) {
      return NextResponse.json(
        { error: 'Missing requisitionId parameter' }, 
        { status: 400 }
      );
    }

    // Get current user
    const user = await getLoggedInUser();
    if (!user || !user.$id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check renewal status
    const { database } = await createAdminClient();
    
    // Check current requisition status
    const requisitions = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('userId', user.$id),
        Query.equal('requisitionId', requisitionId),
        Query.limit(1)
      ]
    );

    if (requisitions.documents.length === 0) {
      return NextResponse.json(
        { error: 'Requisition not found' }, 
        { status: 404 }
      );
    }

    const requisition = requisitions.documents[0];
    
    // Get recent renewal logs
    const renewalLogs = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_RENEWAL_LOG_COLLECTION_ID || 'renewal_logs',
      [
        Query.equal('userId', user.$id),
        Query.equal('requisitionId', requisitionId),
        Query.orderDesc('timestamp'),
        Query.limit(5)
      ]
    );

    return NextResponse.json({
      status: requisition.status || 'unknown',
      bankName: requisition.bankName,
      renewalStartedAt: requisition.renewalStartedAt,
      renewalReason: requisition.renewalReason,
      renewalHistory: renewalLogs.documents.map(log => ({
        status: log.status,
        timestamp: log.timestamp,
        details: log.details ? JSON.parse(log.details) : null
      }))
    });

  } catch (error) {
    console.error('Error retrieving renewal status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve renewal status' }, 
      { status: 500 }
    );
  }
} 