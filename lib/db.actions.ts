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
  // Validate required parameters
  if (!transaction || !requisitionId) {
    console.warn('pushTransactionsDB: Missing transaction or requisitionId');
    return;
  }

  // Ensure transaction has a valid ID
  if (!transaction.transactionId || transaction.transactionId.trim() === '') {
    console.warn('pushTransactionsDB: Transaction missing valid transactionId, skipping:', {
      payee: transaction.Payee,
      amount: transaction.amount,
      date: transaction.bookingDate
    });
    return;
  }

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

  // Check if transaction already exists in the database (only if we have a valid ID)
  let existingTransaction = false;
  try {
    existingTransaction = await checkTransactionExistence(transaction.transactionId);
  } catch (error) {
    console.warn('Error checking transaction existence, proceeding with insert:', error);
    // Continue with the insert since we can't verify existence
  }

  // If the transaction already exists, do not write it to the database
  if (existingTransaction) {
    console.log(`Transaction ${transaction.transactionId} already exists, skipping insert`);
    return;
  }

  try {
    // Validate transactionId format for Appwrite
    const documentId = transaction.transactionId.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Create a new document in the requisitions collection with the user ID and requisition ID
    await database.createDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      documentId, // Use cleaned transaction ID as the document ID
      {
        originalTransactionId: transaction.transactionId, // Keep original ID
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

  } catch (error: any) {
    if (error?.code === 409) {
      // Document already exists, which is fine
      console.log(`Transaction ${transaction.transactionId} already exists in database`);
    } else {
      console.error('Error writing transaction to DB:', error?.message || error);
    }
  }
}

// This function will pull only non-excluded transactions from the database
export async function pullTransactionsDB(requisitionId: string, bankName: string) {
  // Validate inputs
  if (!requisitionId && !bankName) {
    console.error('pullTransactionsDB: Missing both requisitionId and bankName');
    return [];
  }

  const { database } = await createAdminClient();

  try {
    const queries = [];
    
    // Build conditional queries based on available parameters
    const orConditions = [];
    
    if (requisitionId && requisitionId.trim() !== '') {
      orConditions.push(Query.equal('requisitionId', requisitionId));
    }
    
    if (bankName && bankName.trim() !== '') {
      orConditions.push(Query.equal('Bank', bankName));
    }
    
    if (orConditions.length === 0) {
      console.error('pullTransactionsDB: No valid search criteria provided');
      return [];
    }
    
    // Add OR condition only if we have valid criteria
    queries.push(Query.or(orConditions));
    
    // Add exclusion filter
    queries.push(Query.or([
      Query.equal('exclude', false),
      Query.isNull('exclude')
    ]));
    
    queries.push(Query.orderDesc('bookingDateTime'));
    queries.push(Query.limit(5000));
    
    // Fetch transactions with validated query
    const transactions = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      queries
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
  // Validate inputs
  if (!requisitionId && !bankName) {
    console.error('pullAllTransactionsDB: Missing both requisitionId and bankName');
    return [];
  }

  const { database } = await createAdminClient();

  try {
    const allResults = [];
    
    // Fetch transactions by requisitionId if provided
    if (requisitionId && requisitionId.trim() !== '') {
      try {
        const byReq = await database.listDocuments(
          APPWRITE_DATABASE_ID!,
          APPWRITE_TRANSACTION_COLLECTION_ID!,
          [
            Query.equal('requisitionId', requisitionId),
            Query.orderDesc('bookingDateTime'),
            Query.limit(5000),
          ]
        );
        allResults.push(...byReq.documents);
      } catch (error) {
        console.error(`Error fetching transactions by requisitionId ${requisitionId}:`, error);
      }
    }

    // Fetch by bankName if provided
    if (bankName && bankName.trim() !== '') {
      try {
        console.log('Fetching transactions by bank name:', bankName);
        const byBank = await database.listDocuments(
          APPWRITE_DATABASE_ID!,
          APPWRITE_TRANSACTION_COLLECTION_ID!,
          [
            Query.equal('Bank', bankName),
            Query.orderDesc('bookingDateTime'),
            Query.limit(5000),
          ]
        );
        allResults.push(...byBank.documents);
      } catch (error) {
        console.error(`Error fetching transactions by bankName ${bankName}:`, error);
      }
    }

    // Fetch requisition details if requisitionId is available
    let bankLogo = null;
    if (requisitionId && requisitionId.trim() !== '') {
      try {
        const requisitionDetails = await database.listDocuments(
          APPWRITE_DATABASE_ID!,
          APPWRITE_REQ_COLLECTION_ID!,
          [
            Query.equal('requisitionId', requisitionId),
            Query.limit(1),
          ]
        );
        bankLogo = requisitionDetails.documents[0]?.bankLogo;
      } catch (error) {
        console.error(`Error fetching requisition details for ${requisitionId}:`, error);
      }
    }

    // Combine and deduplicate
    const uniqueMap = new Map();
    for (const txn of allResults) {
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
  // Validate transactionId
  if (!transactionId || transactionId.trim() === '') {
    console.error('updateTransactionExclusion: Invalid transactionId provided');
    return null;
  }

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

export async function checkTransactionExistence(transactionId: string): Promise<boolean> {
  // Validate transactionId before making any database calls
  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim() === '') {
    console.warn('checkTransactionExistence: Invalid or empty transactionId provided:', { transactionId });
    return false; // Return false for invalid IDs rather than throwing an error
  }

  const { database } = await createAdminClient();

  try {
    // Clean the transaction ID for Appwrite compatibility
    const cleanTransactionId = transactionId.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Validate the cleaned ID isn't empty
    if (!cleanTransactionId || cleanTransactionId.trim() === '' || cleanTransactionId === '_') {
      console.warn('checkTransactionExistence: Cleaned transactionId is empty:', { 
        original: transactionId, 
        cleaned: cleanTransactionId 
      });
      return false;
    }
    
    // Try to get the document directly first (faster than listing)
    try {
      await database.getDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_TRANSACTION_COLLECTION_ID!,
        cleanTransactionId
      );
      return true; // Document exists
    } catch (error: any) {
      if (error?.code === 404) {
        // Document doesn't exist, also check by originalTransactionId
        // But only if the original ID is valid for querying
        if (transactionId && transactionId.trim() !== '') {
          try {
            const listResult = await database.listDocuments(
              APPWRITE_DATABASE_ID!,
              APPWRITE_TRANSACTION_COLLECTION_ID!,
              [
                Query.equal('originalTransactionId', transactionId.trim()),
                Query.limit(1),
              ]
            );
            return listResult.documents.length > 0;
          } catch (queryError: any) {
            console.warn('checkTransactionExistence: Query by originalTransactionId failed:', {
              transactionId: transactionId,
              error: queryError?.message
            });
            return false;
          }
        }
        return false;
      } else {
        // Some other error occurred
        throw error;
      }
    }

  } catch (error: any) {
    console.error('Error checking transaction existence in Appwrite DB:', error?.message || error);
    return false; // Return false on error to be safe
  }
}