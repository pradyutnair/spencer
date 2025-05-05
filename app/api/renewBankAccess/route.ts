import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

async function handleEndUserAgreement(origin: string, bankName: string) {
  try {
    // Ensure origin is a valid URL base and doesn't end with a trailing slash
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const endUserAgreementUrl = `${baseUrl}/api/endUserAgreement`;

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
      const errorText = await response.text();
      throw new Error(`Failed to call endUserAgreement API: ${response.status} ${errorText}`);
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

    if (!requisitionId) {
      return NextResponse.json({ error: 'Missing requisition ID' }, { status: 400 });
    }

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

    // Get the origin from the request headers or use a default from environment
    const origin = request.headers.get('origin') || 
                  process.env.APP_URL || 
                  'https://localhost:3000';

    if (origin === 'https://localhost:3000') {
      // If using localhost, log a warning to set APP_URL in environment variables
      console.warn('Using fallback domain - please set APP_URL in environment variables');
    }

    // Call the handler function for endUserAgreement
    const data = await handleEndUserAgreement(origin, bankName);

    // Return the data from the endUserAgreement API
    return NextResponse.json(data);

  } catch (error) {
    console.error('RENEW BANK ACCESS Error:', error);
    return NextResponse.json({ error: 'Failed to renew bank access', details: error }, { status: 500 });
  }
}