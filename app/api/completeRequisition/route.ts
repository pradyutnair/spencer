import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { createGoCardlessClient } from '@/lib/gocardless';
import { getLoggedInUser } from '@/lib/user.actions';
import { ID, Query } from 'node-appwrite';
import { z } from 'zod';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

// Validation schema
const CompleteRequisitionSchema = z.object({
  requisitionId: z.string().min(1, 'Requisition ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankLogo: z.string().optional(),
  institutionId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const requisitionData = await request.json();
    
    // Validate request data
    const validatedData = CompleteRequisitionSchema.parse(requisitionData);
    const { requisitionId, userId, bankName, bankLogo, institutionId } = validatedData;

    // Additional validation for authentication
    try {
      const currentUser = await getLoggedInUser();
      if (!currentUser || currentUser.$id !== userId) {
        return NextResponse.json(
          { error: 'Authentication mismatch' }, 
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if requisition already exists in database
    const { database } = await createAdminClient();
    const existingRequisition = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('requisitionId', requisitionId),
        Query.limit(1)
      ]
    );

    if (existingRequisition.documents.length > 0) {
      const existing = existingRequisition.documents[0];
      return NextResponse.json({
        message: 'Requisition already completed',
        existing: {
          requisitionId: existing.requisitionId,
          bankName: existing.bankName,
          completedAt: existing.$createdAt,
          status: existing.status || 'completed'
        }
      }, { status: 200 });
    }

    // Connect to GoCardless and verify the requisition status
    let client;
    let requisition;
    
    try {
      client = await createGoCardlessClient();
      await client.generateToken();
      
      // Get the requisition status from GoCardless with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          requisition = await client.requisition.getRequisitionById(requisitionId);
          break; // Success, exit retry loop
        } catch (reqError: any) {
          retryCount++;
          if (reqError?.response?.status === 404) {
            return NextResponse.json({ 
              error: 'Requisition not found',
              details: 'The bank connection request was not found. Please start the connection process again.',
              action: 'restart_connection'
            }, { status: 404 });
          }
          
          if (retryCount >= maxRetries) {
            throw reqError; // Re-throw if all retries exhausted
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      if (!requisition) {
        return NextResponse.json({ 
          error: 'Unable to retrieve requisition details',
          details: 'Failed to get bank connection details after multiple attempts'
        }, { status: 500 });
      }
      
      // Validate requisition status
      const validStatuses = ['LN', 'GA', 'RJ', 'SA', 'UA', 'GI'];
      if (!validStatuses.includes(requisition.status)) {
        console.warn(`Requisition ${requisitionId} has unknown status: ${requisition.status}`);
      }
      
      // Handle different requisition statuses
      switch (requisition.status) {
        case 'RJ':
          return NextResponse.json({ 
            error: 'Bank connection was rejected',
            details: 'The bank connection was rejected. Please try connecting again.',
            status: requisition.status,
            action: 'retry_connection'
          }, { status: 400 });
          
        case 'UA':
          return NextResponse.json({ 
            error: 'User cancelled the connection',
            details: 'The bank connection was cancelled. Please try again if you want to connect.',
            status: requisition.status,
            action: 'retry_connection'
          }, { status: 400 });
          
        case 'SA':
          return NextResponse.json({ 
            error: 'Session expired',
            details: 'The bank connection session has expired. Please start the connection process again.',
            status: requisition.status,
            action: 'restart_connection'
          }, { status: 410 });
          
        case 'LN':
          console.warn(`Requisition ${requisitionId} still requires linking (status: LN)`);
          return NextResponse.json({ 
            error: 'Additional authorization required', 
            continueLink: requisition.link,
            status: requisition.status,
            action: 'continue_authorization'
          }, { status: 202 });
          
        case 'GI':
          return NextResponse.json({ 
            error: 'Additional information required',
            details: 'The bank requires additional information to complete the connection.',
            status: requisition.status,
            action: 'provide_additional_info'
          }, { status: 202 });
          
        case 'GA':
          // Success case - continue processing
          console.log(`Requisition ${requisitionId} is properly authorized with status: ${requisition.status}`);
          break;
          
        default:
          console.warn(`Requisition ${requisitionId} has unhandled status: ${requisition.status}`);
          return NextResponse.json({ 
            error: 'Unexpected connection status',
            details: `Bank connection status: ${requisition.status}. Please contact support.`,
            status: requisition.status
          }, { status: 400 });
      }
      
      // Check if we have account access
      if (!requisition.accounts || requisition.accounts.length === 0) {
        console.error(`Requisition ${requisitionId} is authorized but has no accounts`);
        return NextResponse.json({ 
          error: 'No accounts associated with this requisition',
          details: 'The bank connection was successful, but no accounts were found. Please contact support.',
          status: requisition.status
        }, { status: 400 });
      }
      
      // Prepare data for database insertion
      const requisitionDataToSave = {
        userId: userId,
        requisitionId: requisitionId,
        bankName: bankName,
        bankLogo: bankLogo || null,
        institutionId: institutionId || bankName,
        status: 'active',
        accountCount: requisition.accounts.length,
        gcStatus: requisition.status,
        connectedAt: new Date().toISOString()
      };

      // Create document in Appwrite
      const newRequisition = await database.createDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_REQ_COLLECTION_ID!,
        ID.unique(),
        requisitionDataToSave
      );

      if (!newRequisition) {
        return NextResponse.json({ 
          error: 'Failed to save requisition to database',
          details: 'Bank connection was successful but could not be saved. Please contact support.'
        }, { status: 500 });
      }

      const processingTime = Date.now() - startTime;

      return NextResponse.json({ 
        success: true,
        message: 'Bank connection completed successfully',
        data: {
          requisitionId: requisitionId,
          bankName: bankName,
          status: requisition.status,
          accountCount: requisition.accounts.length,
          connectedAt: requisitionDataToSave.connectedAt
        },
        metadata: {
          processingTime
        }
      }, {
        headers: {
          'X-Processing-Time': processingTime.toString()
        }
      });
      
    } catch (gcError: any) {
      console.error('Error verifying requisition with GoCardless:', gcError);
      
      // Handle specific GoCardless API errors
      if (gcError?.response?.status === 429) {
        return NextResponse.json({ 
          error: 'Service temporarily unavailable',
          details: 'Bank connection service is busy. Please try again in a few minutes.',
          retryAfter: 300
        }, { status: 503 });
      }
      
      if (gcError?.response?.status === 401) {
        return NextResponse.json({ 
          error: 'Authentication failed with bank service',
          details: 'Unable to verify bank connection. Please try again.',
        }, { status: 502 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to verify requisition status with GoCardless',
        details: 'Unable to verify the bank connection. Please try again or contact support.',
        technicalDetails: gcError instanceof Error ? gcError.message : String(gcError)
      }, { status: 500 });
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        metadata: { processingTime }
      }, { status: 400 });
    }
    
    console.error('COMPLETE REQUISITION POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process requisition completion',
      details: 'An unexpected error occurred. Please try again or contact support.',
      technicalDetails: error instanceof Error ? error.message : String(error),
      metadata: { processingTime }
    }, { status: 500 });
  }
}