import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_TRANSACTION_COLLECTION_ID } =
  process.env;

export async function POST(request: NextRequest) {
  try {
    const { transactionId, exclude } = await request.json();
    console.log('Request Body:', { transactionId, exclude });

    if (transactionId === undefined || exclude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new admin client
    const { database } = await createAdminClient();

    // Update the document in the transactions collection
    const updatedExclusion = await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      transactionId,
      { exclude }
    );

    if (!updatedExclusion) {
      return NextResponse.json({ error: 'Failed to update excluded transaction in database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction exclusion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}