import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { createGoCardlessClient } from '@/lib/gocardless';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;
const GOCARDLESS_API_URL = process.env.GOCARDLESS_API_URL || 'https://bankaccountdata.gocardless.com/api/v2';

export async function POST(request: NextRequest) {
  try {
    const { newRequisitionId, oldRequisitionId } = await request.json();

    if (!newRequisitionId || !oldRequisitionId) {
      return NextResponse.json({ error: 'Missing requisition IDs' }, { status: 400 });
    }

    const { database } = await createAdminClient();
    
    // First, verify that the new requisition is valid and authorized
    try {
      const client = await createGoCardlessClient();
      await client.generateToken();
      
      // Get the new requisition status from GoCardless
      const newRequisition = await client.requisition.getRequisitionById(newRequisitionId);
      
      // Check if the new requisition is valid (GA = granted access)
      if (newRequisition.status !== 'GA') {
        return NextResponse.json({ 
          error: 'New bank connection is not properly authorized', 
          status: newRequisition.status,
          details: `New requisition ${newRequisitionId} has status ${newRequisition.status}, expected 'GA'`
        }, { status: 400 });
      }
      
      // Check if we have account access in the new requisition
      if (!newRequisition.accounts || newRequisition.accounts.length === 0) {
        return NextResponse.json({ 
          error: 'New bank connection has no accounts associated with it'
        }, { status: 400 });
      }
      
      console.log(`New requisition ${newRequisitionId} is valid with status: ${newRequisition.status} and ${newRequisition.accounts.length} accounts`);
      
      // Continue with the process once validation is successful
    } catch (gcError) {
      console.error('Error verifying new requisition with GoCardless:', gcError);
      return NextResponse.json({ 
        error: 'Failed to verify new requisition status with GoCardless',
        details: gcError instanceof Error ? gcError.message : String(gcError)  
      }, { status: 500 });
    }

    // Get the old requisition from Appwrite
    const oldRequisitionRequest = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('requisitionId', oldRequisitionId)
      ]
    );

    if (!oldRequisitionRequest.documents.length) {
      return NextResponse.json({ error: 'Old requisition not found in database' }, { status: 404 });
    }
    
    // Store original document for reference
    const originalDocument = oldRequisitionRequest.documents[0];

    // Update the old requisition with the new requisition ID
    const updatedOldRequisition = await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      originalDocument.$id,
      {
        requisitionId: newRequisitionId,
        $createdAt: new Date().toISOString(), // Format correctly for database
        lastRenewed: new Date().toISOString(), // Add renewal timestamp
        previousRequisitionId: oldRequisitionId // Keep track of the old ID
      }
    );

    if (!updatedOldRequisition) {
      return NextResponse.json({ error: 'Failed to modify renewed bank' }, { status: 500 });
    }

    // Try to delete the old requisition from GoCardless but don't fail if this step fails
    try {
      const client = await createGoCardlessClient();
      const tokenData = await client.generateToken();
      const accessToken = tokenData.access;

      // Delete the old requisition using GoCardless API
      const response = await fetch(`${GOCARDLESS_API_URL}/requisitions/${oldRequisitionId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`Failed to delete old requisition ${oldRequisitionId} from GoCardless API, but database was updated successfully. Status: ${response.status}`);
      } else {
        console.log(`Successfully deleted old requisition ${oldRequisitionId} from GoCardless`);
      }
    } catch (gcError) {
      // Log the error but don't fail the entire operation
      console.error('Error deleting old requisition from GoCardless:', gcError);
    }

    return NextResponse.json({ 
      message: 'Requisition updated and old requisition deletion attempted successfully',
      oldRequisitionId: oldRequisitionId,
      newRequisitionId: newRequisitionId
    });

  } catch (error) {
    console.error('Error in modifyRenewedBank POST:', error);
    return NextResponse.json({ 
      error: 'Failed to modify renewed bank', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}