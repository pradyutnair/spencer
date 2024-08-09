import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_TRANSACTION_COLLECTION_ID } = process.env;

export async function POST(request: NextRequest) {
  try {
    const { transactionId, category } = await request.json();
    console.log('Request Body:', { transactionId, category });

    if (transactionId === undefined || category === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new admin client
    const { database } = await createAdminClient();

    // Fetch the current transaction to get its Payee
    let currentTransaction = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.equal('$id', transactionId),
      ]
    );

    let result = currentTransaction.documents[0];
    const payee = result.Payee;
    const firstWord = payee.split(' ')[0];

    console.log('Current Transaction:', result);
    // console.log('Payee:', payee);
    // console.log('First Word:', firstWord);

    // Query for all transactions with the same Payee
    let query;
    if (firstWord && firstWord.length > 1){
      query = Query.startsWith('Payee', firstWord);
    } else {
      query = Query.contains('Payee', payee);
    }
    const matchingTransactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [query, Query.limit(50000000000)]
    );

    //console.log('Matching transactions', matchingTransactions)
    console.log('Matching Transactions Count:', matchingTransactions.documents.length);
    console.log('Category:', category);

    // Update all matching transactions
    for (const document of matchingTransactions.documents) {
      await database.updateDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_TRANSACTION_COLLECTION_ID!,
        document.$id,
        { category }
      );
    }

    // Update the current transaction
    await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      transactionId,
      { category }
    );

    return NextResponse.json({ message: 'Transactions updated successfully' });
  } catch (error) {
    console.error('Error updating transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}