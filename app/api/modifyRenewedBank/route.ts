import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { createGoCardlessClient } from '@/lib/gocardless';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

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
        $createdAt: Date.now() // Update the created time to the current time so it is new
      }
    );

    if (!updatedOldRequisition) {
      return NextResponse.json({ error: 'Failed to modify renewed bank' }, { status: 500 });
    } else {
      const client = await createGoCardlessClient();
      const tokenData = await client.generateToken();
      const accessToken = tokenData.access;

    // Delete the old requisition using GoCardless API
    const response = await fetch(`https://bankaccountdata.gocardless.com/api/v2/requisitions/${oldRequisitionId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete old requisition');
    }

    }

    return NextResponse.json({ message: 'Requisition updated and old requisition deleted successfully' });

  } catch (error) {
    console.error('Error in modifyRenewedBank POST:', error);
    return NextResponse.json({ error: 'Failed to modify renewed bank', details: error.message }, { status: 500 });
  }
}