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

    // Get the old requisition
    const oldRequisitionRequest = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('requisitionId', oldRequisitionId)
      ]
    );

    if (!oldRequisitionRequest.documents.length) {
      return NextResponse.json({ error: 'Old requisition not found' }, { status: 404 });
    }

    // Update the old requisition with the new requisition ID
    const updatedOldRequisition = await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      oldRequisitionRequest.documents[0].$id,
      {
        requisitionId: newRequisitionId,
        $createdAt: new Date().toISOString() // Format correctly for database
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
      }
    } catch (gcError) {
      // Log the error but don't fail the entire operation
      console.error('Error deleting old requisition from GoCardless:', gcError);
    }

    return NextResponse.json({ message: 'Requisition updated and old requisition deletion attempted successfully' });

  } catch (error) {
    console.error('Error in modifyRenewedBank POST:', error);
    return NextResponse.json({ error: 'Failed to modify renewed bank', details: error }, { status: 500 });
  }
}