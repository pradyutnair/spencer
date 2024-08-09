import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

async function handleEndUserAgreement(origin: string, bankName: string) {
  try {
    const endUserAgreementUrl = `${origin}/api/endUserAgreement`;

    const response = await fetch(endUserAgreementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        institutionId: bankName,
        redirectUrl: '/gocardless-renewal'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to call endUserAgreement API');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in handleEndUserAgreement:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requisitionId } = await request.json();
    console.log('Requisition ID from RENEWAL API:', requisitionId);

    const { database } = await createAdminClient();

    // Query the requisition by ID
    const requisitionRequest = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('requisitionId', requisitionId)
      ]
    );

    if (!requisitionRequest.documents.length) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
    }

    // Get the bankName from the requisition
    const { bankName } = requisitionRequest.documents[0];
    console.log('Bank Name:', bankName);

    // Get the origin from the request headers or set a default value
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Call the handler function for endUserAgreement
    const data = await handleEndUserAgreement(origin, bankName);

    console.log('End User Agreement data:', data);
    // Return the data from the endUserAgreement API
    return NextResponse.json(data);

  } catch (error) {
    console.error('COMPLETE REQUISITION POST Error:', error);
    return NextResponse.json({ error: 'Failed to complete requisition', details: error.message }, { status: 500 });
  }
}