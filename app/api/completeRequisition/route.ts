import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { createGoCardlessClient } from '@/lib/gocardless';
import { ID } from 'node-appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

export async function POST(request: NextRequest) {
  try {
    const requisitionData = await request.json();
    const { requisitionId } = requisitionData;

    // Validate that requisitionId exists
    if (!requisitionId) {
      return NextResponse.json({ error: 'Missing requisitionId' }, { status: 400 });
    }

    // Connect to GoCardless and verify the requisition status
    try {
      const client = await createGoCardlessClient();
      await client.generateToken();
      
      // Get the requisition status from GoCardless
      const requisition = await client.requisition.getRequisitionById(requisitionId);
      
      // Check if the requisition status is successful (typically 'LN' - link needed, or 'GA' - granted access)
      if (requisition.status !== 'LN' && requisition.status !== 'GA') {
        console.warn(`Requisition ${requisitionId} has status ${requisition.status}, which indicates it may not be properly authorized`);
        return NextResponse.json({ 
          error: 'Requisition not properly authorized with the bank',
          status: requisition.status 
        }, { status: 400 });
      }
      
      // If the status is LN, it means link is still needed - additional authorization steps may be required
      if (requisition.status === 'LN') {
        console.warn(`Requisition ${requisitionId} still requires linking (status: LN). Returning link for continuation.`);
        return NextResponse.json({ 
          error: 'Additional authorization required', 
          continueLink: requisition.link,
          status: requisition.status 
        }, { status: 202 }); // 202 Accepted - processing but not complete
      }
      
      // If we get here, the requisition is correctly authorized (status GA - granted access)
      console.log(`Requisition ${requisitionId} is properly authorized with status: ${requisition.status}`);
      
      // Check if we have account access
      if (!requisition.accounts || requisition.accounts.length === 0) {
        console.error(`Requisition ${requisitionId} is authorized but has no accounts`);
        return NextResponse.json({ 
          error: 'No accounts associated with this requisition' 
        }, { status: 400 });
      }
      
      // Now save to Appwrite database
      const { database } = await createAdminClient();

      // Create document in Appwrite
      const newRequisition = await database.createDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_REQ_COLLECTION_ID!,
        ID.unique(),
        requisitionData
      );

      if (!newRequisition) {
        return NextResponse.json({ error: 'Failed to save requisition to database' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        status: requisition.status,
        accountCount: requisition.accounts.length
      });
      
    } catch (gcError) {
      console.error('Error verifying requisition with GoCardless:', gcError);
      return NextResponse.json({ 
        error: 'Failed to verify requisition status with GoCardless',
        details: gcError instanceof Error ? gcError.message : String(gcError)  
      }, { status: 500 });
    }
  } catch (error) {
    console.error('COMPLETE REQUISITION POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process requisition completion',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}