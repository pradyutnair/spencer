import { createAdminClient } from '@/lib/appwrite';
import { Transaction } from '@/types/index';
import { Query, ID } from 'node-appwrite';
import { wordsToRemove } from './wordsToRemove';

const {
  APPWRITE_DATABASE_ID,
  APPWRITE_REQ_COLLECTION_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID,
  APPWRITE_USER_COLLECTION_ID
} = process.env;

// Connection pool for database clients
class DatabasePool {
  private static instance: DatabasePool;
  private clients: any[] = [];
  private maxConnections = 10;
  private currentIndex = 0;

  private constructor() {
    this.initializePool();
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  private async initializePool() {
    for (let i = 0; i < this.maxConnections; i++) {
      const client = await createAdminClient();
      this.clients.push(client);
    }
  }

  getClient() {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.maxConnections;
    return client;
  }
}

// Optimized transaction operations with batch processing
export class TransactionService {
  private dbPool = DatabasePool.getInstance();

  // Batch insert transactions with conflict resolution
  async batchInsertTransactions(transactions: Transaction[], requisitionId: string): Promise<void> {
    const { database } = this.dbPool.getClient();
    const batchSize = 25; // Appwrite batch limit
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const operations = batch.map(transaction => this.prepareTransactionForInsert(transaction, requisitionId));
      
      try {
        await Promise.allSettled(
          operations.map(op => 
            database.createDocument(
              APPWRITE_DATABASE_ID!,
              APPWRITE_TRANSACTION_COLLECTION_ID!,
              op.id,
              op.data
            )
          )
        );
      } catch (error) {
        console.error(`Batch insert failed for batch starting at ${i}:`, error);
        // Continue with next batch rather than failing entirely
      }
    }
  }

  private prepareTransactionForInsert(transaction: Transaction, requisitionId: string) {
    // Validate and sanitize amount
    let amount = Number(transaction.amount);
    if (isNaN(amount) || Math.abs(amount) > 10000000000000) {
      amount = 0;
    }

    // Validate booking date
    let bookingDateTime = transaction.bookingDateTime;
    if (!bookingDateTime || isNaN(Date.parse(bookingDateTime))) {
      bookingDateTime = transaction.bookingDate;
    }

    return {
      id: transaction.transactionId,
      data: {
        requisitionId,
        amount,
        currency: transaction.currency,
        bookingDate: transaction.bookingDate,
        bookingDateTime,
        Payee: transaction.Payee?.substring(0, 255), // Limit length
        Bank: transaction.Bank?.substring(0, 100),
        Year: transaction.Year,
        Month: transaction.Month,
        Week: transaction.Week,
        Day: transaction.Day,
        DayOfWeek: transaction.DayOfWeek,
        Description: transaction.Description?.substring(0, 500),
        category: transaction.category,
        exclude: false,
        // Add search-optimized fields
        payeeNormalized: this.normalizeSearchText(transaction.Payee),
        descriptionNormalized: this.normalizeSearchText(transaction.Description),
      }
    };
  }

  private normalizeSearchText(text?: string): string {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  }

  // Optimized transaction retrieval with single query
  async getTransactionsOptimized(
    requisitionIds: string[],
    bankNames: string[] = [],
    options: {
      excludeFiltered?: boolean;
      limit?: number;
      offset?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<Transaction[]> {
    const { database } = this.dbPool.getClient();
    const { excludeFiltered = true, limit = 5000, offset = 0, dateFrom, dateTo } = options;

    try {
      // Build query conditions
      const queries = [];
      
      // Add requisition/bank filters
      if (requisitionIds.length > 0 || bankNames.length > 0) {
        const conditions = [];
        if (requisitionIds.length > 0) {
          conditions.push(Query.equal('requisitionId', requisitionIds));
        }
        if (bankNames.length > 0) {
          conditions.push(Query.equal('Bank', bankNames));
        }
        queries.push(Query.or(conditions));
      }

      // Add exclusion filter
      if (excludeFiltered) {
        queries.push(Query.or([
          Query.equal('exclude', false),
          Query.isNull('exclude')
        ]));
      }

      // Add date filters
      if (dateFrom) {
        queries.push(Query.greaterThanEqual('bookingDate', dateFrom));
      }
      if (dateTo) {
        queries.push(Query.lessThanEqual('bookingDate', dateTo));
      }

      // Add ordering and pagination
      queries.push(Query.orderDesc('bookingDateTime'));
      queries.push(Query.limit(limit));
      if (offset > 0) {
        queries.push(Query.offset(offset));
      }

      const response = await database.listDocuments(
        APPWRITE_DATABASE_ID!,
        APPWRITE_TRANSACTION_COLLECTION_ID!,
        queries
      );

      // Server-side deduplication using Map
      const uniqueTransactions = new Map<string, any>();
      
      response.documents.forEach(doc => {
        const key = doc.$id;
        if (!uniqueTransactions.has(key)) {
          uniqueTransactions.set(key, doc);
        }
      });

      // Filter out transactions with blacklisted words
      return Array.from(uniqueTransactions.values())
        .filter(transaction => 
          !wordsToRemove.some(word => 
            transaction.payeeNormalized?.includes(word.toLowerCase()) ||
            transaction.descriptionNormalized?.includes(word.toLowerCase())
          )
        );

    } catch (error) {
      console.error('Error in optimized transaction retrieval:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  // Optimized transaction existence check with caching
  private existenceCache = new Map<string, boolean>();
  
  async checkTransactionExists(transactionId: string): Promise<boolean> {
    // Check cache first
    if (this.existenceCache.has(transactionId)) {
      return this.existenceCache.get(transactionId)!;
    }

    const { database } = this.dbPool.getClient();
    
    try {
      const result = await database.getDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_TRANSACTION_COLLECTION_ID!,
        transactionId
      );
      
      const exists = !!result;
      this.existenceCache.set(transactionId, exists);
      return exists;
    } catch (error: any) {
      if (error?.code === 404) {
        this.existenceCache.set(transactionId, false);
        return false;
      }
      throw error;
    }
  }

  // Batch update exclusions
  async batchUpdateExclusions(updates: Array<{transactionId: string, exclude: boolean}>): Promise<void> {
    const { database } = this.dbPool.getClient();
    
    const updatePromises = updates.map(({transactionId, exclude}) =>
      database.updateDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_TRANSACTION_COLLECTION_ID!,
        transactionId,
        { exclude }
      ).catch(error => {
        console.error(`Failed to update exclusion for transaction ${transactionId}:`, error);
        return null;
      })
    );

    await Promise.allSettled(updatePromises);
  }
}

// Singleton instance
export const transactionService = new TransactionService();

// Legacy function wrappers for backward compatibility
export async function pushTransactionsDB(transaction: Transaction, requisitionId: string) {
  return transactionService.batchInsertTransactions([transaction], requisitionId);
}

export async function pullTransactionsDB(requisitionId: string, bankName: string) {
  return transactionService.getTransactionsOptimized([requisitionId], [bankName]);
}

export async function pullAllTransactionsDB(requisitionId: string, bankName: string) {
  return transactionService.getTransactionsOptimized([requisitionId], [bankName], { excludeFiltered: false });
}

export async function updateTransactionExclusion(transactionId: string, exclude: boolean) {
  return transactionService.batchUpdateExclusions([{transactionId, exclude}]);
}

export async function checkTransactionExistence(transactionId: string) {
  return transactionService.checkTransactionExists(transactionId);
} 