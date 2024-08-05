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

  // Check if bookingDateTime is a valid date otherwise set it to bookingDate
  if (transaction.bookingDateTime === undefined || isNaN(Date.parse(transaction.bookingDateTime))) {
    transaction.bookingDateTime = transaction.bookingDate;
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
        category: transaction.category,
        exclude: false, // Default value for exclude
      }
    );

  } catch (error) {
    // console.error('Error writing transaction to DB:', error.type);
    // Do nothing and continue
  }
}

// This function will pull only non-excluded transactions from the database
export async function pullTransactionsDB(requisitionId: string) {
  const { database } = await createAdminClient();

  try {
    // Fetch all transactions with the provided requisition ID
    const transactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.contains('requisitionId', requisitionId),
        Query.orderDesc('bookingDateTime'),
        Query.or([
          Query.equal('exclude', false),
          Query.isNull('exclude')
        ]),
        Query.limit(5000000), // Adjust this number based on your needs
      ]
    );

    // Log
    console.log('Transactions successfully fetched from Appwrite DB for ' +
      'requisition ID:', transactions.documents.length);

    return transactions.documents;


  } catch (error) {
    console.error('Error fetching transactions from Appwrite DB:', error);
    return [];
  }
}

// This function will pull all transactions from the database
export async function pullAllTransactionsDB(requisitionId: string) {
  const { database } = await createAdminClient();

  try {
    // Fetch all transactions with the provided requisition ID
    let transactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.contains('requisitionId', requisitionId),
        Query.orderDesc('bookingDateTime'),
        Query.limit(100), // Adjust this number based on your needs
      ]
    );

    // Fetch all requisition details for the provided requisition ID
    const requisitionDetails = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.contains('requisitionId', requisitionId),
        Query.limit(1),
      ]
    );

    // Subset only the requisitionId and bankLogo from the requisition details
    const requisitionDetailsSubset = requisitionDetails.documents.map((doc) => {
      return {
        requisitionId: doc.requisitionId,
        bankLogo: doc.bankLogo,
      };
    });

    // Add the bankLogo to each transaction
    transactions.documents = transactions.documents.map((doc) => {
      return {
        ...doc,
        bankLogo: requisitionDetailsSubset[0].bankLogo,
      };
    });

    // Log
    console.log('Transactions successfully fetched from Appwrite DB for requisition ID:', transactions.documents.length);

    return transactions.documents;


  } catch (error) {
    console.error('Error fetching transactions from Appwrite DB:', error);
    return [];
  }
}

export async function updateTransactionExclusion(transactionId: string, exclude: boolean) {
  const { database } = await createAdminClient();

  try {
    // Update the document in the transactions collection
    const updatedExclusion = await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      transactionId,
      {
        exclude: exclude,
      }
    );

    console.log('Transaction exclusion updated successfully in Appwrite DB:', updatedExclusion);

    return updatedExclusion

  } catch (error) {
    console.error('Error updating transaction exclusion in Appwrite DB:', error);
    return null;
  }
}