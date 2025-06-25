import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createGoCardlessClient } from '@/lib/gocardless';
import { createAdminClient } from '@/lib/appwrite';
import { getLoggedInUser } from '@/lib/user.actions';
import { ID, Query } from 'node-appwrite';
import { z } from 'zod';

// Validation schema
const ConnectBankSchema = z.object({
  institutionId: z.string().min(1, 'Institution ID is required'),
  redirectUrl: z.string().optional(),
  maxHistoricalDays: z.number().min(1).max(730).optional().default(730),
  accessValidForDays: z.number().min(1).max(180).optional().default(90)
});

// Track connection attempts
async function recordConnectionAttempt(userId: string, institutionId: string, status: string, details?: any) {
  try {
    const { database } = await createAdminClient();
    await database.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_CONNECTION_LOG_COLLECTION_ID || 'connection_logs',
      ID.unique(),
      {
        userId,
        institutionId,
        status,
        details: JSON.stringify(details || {}),
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error recording connection attempt:', error);
  }
}

// Check for existing connections
async function checkExistingConnection(userId: string, institutionId: string) {
  try {
    const { database } = await createAdminClient();
    const existing = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('userId', userId),
        Query.equal('institutionId', institutionId),
        Query.equal('status', 'active'),
        Query.limit(1)
      ]
    );
    return existing.documents.length > 0 ? existing.documents[0] : null;
  } catch (error) {
    console.error('Error checking existing connections:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = ConnectBankSchema.parse(body);
    const { institutionId, redirectUrl, maxHistoricalDays, accessValidForDays } = validatedData;

    // Get current user
    let user;
    try {
      user = await getLoggedInUser();
      if (!user || !user.$id) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication', details: 'Please log in again' }, 
        { status: 401 }
      );
    }

    // Check for existing active connection
    const existingConnection = await checkExistingConnection(user.$id, institutionId);
    if (existingConnection) {
      await recordConnectionAttempt(user.$id, institutionId, 'duplicate_attempt');
      return NextResponse.json({
        warning: 'Bank already connected',
        existingConnection: {
          requisitionId: existingConnection.requisitionId,
          bankName: existingConnection.bankName,
          connectedAt: existingConnection.$createdAt
        }
      }, { status: 200 });
    }

    // Determine origin and redirect URL
    const origin = request.headers.get('origin') || 
                  process.env.APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

    if (!origin) {
      await recordConnectionAttempt(user.$id, institutionId, 'error', { error: 'No origin configured' });
      return NextResponse.json(
        { error: 'Application URL not configured. Please contact support.' }, 
        { status: 500 }
      );
    }

    const finalRedirectUrl = redirectUrl 
      ? `${origin}${redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`}`
      : `${origin}/gocardless-redirect`;

    // Generate reference ID for tracking
    const referenceId = randomUUID();

    // Initialize GoCardless client with circuit breaker pattern
    let client;
    try {
      client = await createGoCardlessClient();
      await client.generateToken();
    } catch (error: any) {
      await recordConnectionAttempt(user.$id, institutionId, 'gocardless_error', { 
        error: error.message,
        step: 'client_initialization'
      });
      
      return NextResponse.json({
        error: 'Bank connection service temporarily unavailable',
        details: 'Please try again in a few minutes',
        retryAfter: 300 // 5 minutes
      }, { status: 503 });
    }

    // Attempt to create bank connection session
    let sessionResult;
    try {
      // Try with full parameters first
      sessionResult = await client.initSession({
        redirectUrl: finalRedirectUrl,
        institutionId: institutionId,
        referenceId: referenceId,
        accessValidForDays: accessValidForDays,
        maxHistoricalDays: maxHistoricalDays,
        userLanguage: 'en' // Default to English
      });

      console.log(`Bank connection session created successfully for user ${user.$id} with institution ${institutionId}`);

    } catch (initError: any) {
      console.error(`Error with full parameters for ${institutionId}:`, initError.message);
      
      // Fallback to minimal parameters
      try {
        sessionResult = await client.initSession({
          redirectUrl: finalRedirectUrl,
          institutionId: institutionId,
          referenceId: referenceId
        });
        
        console.log(`Bank connection session created with minimal parameters for user ${user.$id}`);
        
      } catch (fallbackError: any) {
        await recordConnectionAttempt(user.$id, institutionId, 'session_creation_failed', {
          primaryError: initError.message,
          fallbackError: fallbackError.message
        });
        
        // Handle specific GoCardless errors
        if (fallbackError.message?.includes('institution') || fallbackError.message?.includes('INVALID_INSTITUTION')) {
          return NextResponse.json({
            error: 'Bank not supported',
            details: 'The selected bank is not currently supported. Please try another bank.',
            supportedBanks: '/api/v2/banks/supported'
          }, { status: 400 });
        }
        
        return NextResponse.json({
          error: 'Failed to create bank connection',
          details: 'Unable to establish connection with the bank. Please try again.',
          supportContact: process.env.SUPPORT_EMAIL || 'support@example.com'
        }, { status: 500 });
      }
    }

    // Record successful attempt
    await recordConnectionAttempt(user.$id, institutionId, 'session_created', {
      requisitionId: sessionResult.id,
      referenceId: referenceId
    });

    const processingTime = Date.now() - startTime;

    // Return success response with all necessary information
    return NextResponse.json({
      success: true,
      link: sessionResult.link,
      requisitionId: sessionResult.id,
      referenceId: referenceId,
      institutionId: institutionId,
      expiresAt: new Date(Date.now() + (accessValidForDays * 24 * 60 * 60 * 1000)).toISOString(),
      instructions: {
        next: 'Follow the link to connect your bank account',
        completion: 'You will be redirected back to complete the setup'
      },
      metadata: {
        processingTime,
        fallbackUsed: !sessionResult.maxHistoricalDays // Indicates if fallback was used
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

    console.error('Bank connection error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred. Please try again.',
      metadata: { processingTime }
    }, { status: 500 });
  }
}

// GET endpoint to retrieve connection status
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

    // Check connection status in database
    const { database } = await createAdminClient();
    const connection = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('userId', user.$id),
        Query.equal('requisitionId', requisitionId),
        Query.limit(1)
      ]
    );

    if (connection.documents.length === 0) {
      // Check with GoCardless for status
      try {
        const client = await createGoCardlessClient();
        await client.generateToken();
        const gcStatus = await client.requisition.getRequisitionById(requisitionId);
        
        return NextResponse.json({
          status: gcStatus.status,
          source: 'gocardless',
          details: 'Connection not yet saved to database'
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Connection not found' }, 
          { status: 404 }
        );
      }
    }

    const connectionData = connection.documents[0];
    return NextResponse.json({
      status: connectionData.status || 'unknown',
      bankName: connectionData.bankName,
      connectedAt: connectionData.$createdAt,
      source: 'database'
    });

  } catch (error) {
    console.error('Error retrieving connection status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve connection status' }, 
      { status: 500 }
    );
  }
} 