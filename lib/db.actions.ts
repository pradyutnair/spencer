import {ID} from 'appwrite';
import { createAdminClient } from '@/lib/appwrite';
import { Transaction } from '@/types/index';
import { Query } from 'node-appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID, APPWRITE_USER_COLLECTION_ID } = process.env;

export async function pushTransactionsDB(transaction: Transaction, requisitionId: string) {
  // Create a new admin client
  const { database } = await createAdminClient();

  // Parse transaction.amount to a number and check its range
  let amount = Number(transaction.amount);
  if (isNaN(amount) || amount > 10000000000000 || amount < -10000000000000) {
    amount = 0;
  }

  try {
    // Create a new document in the requisitions collection with the user ID and requisition ID
    await database.createDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      transaction.transactionId, // Use the transaction ID as the document ID
      {
        requisitionId: requisitionId,
        amount: amount,
        currency: transaction.currency,
        bookingDate: transaction.bookingDate,
        bookingDateTime: transaction.bookingDateTime,
        Payee: transaction.Payee,
        Bank: transaction.Bank,
        Year: transaction.Year,
        Month: transaction.Month,
        Week: transaction.Week,
        Day: transaction.Day,
        DayOfWeek: transaction.DayOfWeek,
        Description: transaction.Description,
      }
    );

  } catch (error) {
    console.error('Error writing transaction to DB:', error);
  }
}

export async function pullTransactionsDB(requisitionId: string) {
  const { database } = await createAdminClient();

  try {
    // Fetch all transactions with the provided requisition ID
    const transactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.contains('requisitionId', requisitionId),
        Query.limit(1000)
      ]
    );

    // Log
    console.log('Transactions successfully fetched from Appwrite DB for requisition ID:', transactions.documents.length);

    return transactions.documents;


  } catch (error) {
    console.error('Error fetching transactions from Appwrite DB:', error);
    return [];
  }
}