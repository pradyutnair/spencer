import { createAdminClient } from '@/lib/appwrite';
import { Transaction } from '@/types/index';
import { Query } from 'node-appwrite';
import { wordsToRemove } from './wordsToRemove';

const {
  APPWRITE_DATABASE_ID,
  APPWRITE_REQ_COLLECTION_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID,
  APPWRITE_USER_COLLECTION_ID
} = process.env;

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

  // Check if transaction already exists in the database
  const existingTransaction = await checkTransactionExistence(transaction.transactionId);

  // If the transaction already exists, do not write it to the database
  if (existingTransaction) {
    return;
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
export async function pullTransactionsDB(requisitionId: string, bankName: string) {
  const { database } = await createAdminClient();

  try {
    // Fetch transactions with a single query using OR filters
    const transactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.or([
          Query.equal('requisitionId', requisitionId),
          Query.equal('Bank', bankName)
        ]),
        Query.or([
          Query.equal('exclude', false),
          Query.isNull('exclude')
        ]),
        Query.orderDesc('bookingDateTime'),
        Query.limit(5000),
      ]
    );

    // Use a Map with transactionId as key to deduplicate transactions
    const uniqueTransactions = new Map();
    
    for (const transaction of transactions.documents) {
      // Use transactionId as the deduplication key
      // If the document doesn't have an $id, use a combination of other identifying fields
      const dedupeKey = transaction.$id || 
                      `${transaction.Payee}_${transaction.amount}_${transaction.bookingDate}`;
                      
      // If this transaction hasn't been seen before, or if we're replacing 
      // a bankName match with a more specific requisitionId match
      if (!uniqueTransactions.has(dedupeKey) || 
         (transaction.requisitionId === requisitionId && 
          uniqueTransactions.get(dedupeKey).requisitionId !== requisitionId)) {
        uniqueTransactions.set(dedupeKey, transaction);
      }
    }

    // Get the unique transactions as an array
    const result = Array.from(uniqueTransactions.values());
    
    // Filter out transactions containing words to remove
    return result.filter(transaction => 
      !wordsToRemove.some(word => 
        transaction.Payee && transaction.Payee.includes(word)
      )
    );
  } catch (error) {
    console.error('Error fetching transactions from Appwrite DB:', error);
    return [];
  }
}

// This function will pull all transactions from the database
export async function pullAllTransactionsDB(requisitionId: string, bankName: string) {
  const { database } = await createAdminClient();

  try {
    // Fetch transactions by requisitionId
    const byReq = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.equal('requisitionId', requisitionId),
        Query.orderDesc('bookingDateTime'),
        Query.limit(5000),
      ]
    );

    // Fetch by bankName
    console.log('Fetching transactions by bank name:', bankName);
    const byBank = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.equal('bankName', bankName),
        Query.orderDesc('bookingDateTime'),
        Query.limit(5000),
      ]
    );

    // Fetch requisition details once (assume by requisitionId)
    const requisitionDetails = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      [
        Query.equal('requisitionId', requisitionId),
        Query.limit(1),
      ]
    );
    const bankLogo = requisitionDetails.documents[0]?.bankLogo;

    // Combine and deduplicate
    const all = [...byReq.documents, ...byBank.documents];
    const uniqueMap = new Map();
    for (const txn of all) {
      uniqueMap.set(txn.$id, { ...txn, bankLogo });
    }

    console.log(`Transactions fetched for ${requisitionId || bankName}: ${uniqueMap.size}`);
    return Array.from(uniqueMap.values());

  } catch (error) {
    console.error('Error fetching all transactions:', error);
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

export async function checkTransactionExistence(transactionId: string) {
  const { database } = await createAdminClient();

  try {
    // Update the document in the transactions collection
    const updatedExclusion = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      [
        Query.equal('$id', transactionId),
        Query.limit(1),
      ]
    );

    // Return true if the transaction exists, false otherwise
    return updatedExclusion.documents.length > 0;



  } catch (error) {
    console.error('Error checking transaction existence in Appwrite DB:', error);
    return null;
  }
}