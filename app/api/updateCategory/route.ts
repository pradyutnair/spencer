import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/appwrite";
import { Query } from "appwrite";

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
        Query.equal('$id', transactionId)
      ]
    );

    let result = currentTransaction.documents[0];
    const payee = result.Payee;
    const firstWord = payee.split(' ')[0];

    // Query for all transactions with the same Payee
    const matchingTransactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.or([
          Query.contains('Payee', payee),
          Query.contains('Payee', firstWord)
          ])
      ]
    );

    // Update all matching transactions
    const updatePromises = matchingTransactions.documents.map(transaction =>
      database.updateDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_TRANSACTION_COLLECTION_ID!,
        transaction.$id,
        { category }
      )
    );

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Transactions updated successfully' });
  } catch (error) {
    console.error('Error updating transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}