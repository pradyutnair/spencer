import { getRequisitions } from '@/lib/bank.actions';
import { transactionService } from '@/lib/db.actions.improved';
import { createGoCardlessClient } from '@/lib/gocardless';
import { Transaction } from '@/types/index';

// Token management with caching
class TokenManager {
  private static instance: TokenManager;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private refreshPromise: Promise<string> | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string> {
    // If token is still valid, return it
    if (this.token && Date.now() < this.tokenExpiry - 60000) { // 1 minute buffer
      return this.token;
    }

    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Start a new token refresh
    this.refreshPromise = this.refreshToken();
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshToken(): Promise<string> {
    try {
      const client = await createGoCardlessClient();
      const tokenResponse = await client.generateToken();
      
      this.token = tokenResponse.access;
      // GoCardless tokens typically last 1 hour
      this.tokenExpiry = Date.now() + (tokenResponse.access_expires || 3600) * 1000;
      
      console.log(`New GoCardless token obtained, expires at: ${new Date(this.tokenExpiry).toISOString()}`);
      return this.token;
    } catch (error) {
      console.error('Failed to refresh GoCardless token:', error);
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  invalidateToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
  }
}

// Rate limiter with exponential backoff
class RateLimiter {
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 100; // Adjust based on GoCardless limits

  async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check if we're at the limit
    if (this.requestCount >= this.maxRequests) {
      const resetTime = this.windowStart + this.windowMs - now;
      throw new RateLimitError(`Rate limit exceeded. Reset in ${resetTime}ms`, resetTime);
    }

    this.requestCount++;
  }

  getStats(): { requestCount: number; remainingRequests: number; resetTime: number } {
    const now = Date.now();
    const resetTime = this.windowStart + this.windowMs - now;
    
    return {
      requestCount: this.requestCount,
      remainingRequests: Math.max(0, this.maxRequests - this.requestCount),
      resetTime: Math.max(0, resetTime)
    };
  }
}

class RateLimitError extends Error {
  constructor(message: string, public resetTime: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Circuit breaker specifically for GoCardless API
class GoCardlessCircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 300000; // 5 minutes
  private readonly successThreshold = 3; // Required successes in HALF_OPEN state

  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      } else {
        if (fallback) {
          console.log('Circuit breaker OPEN, using fallback');
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN. Retry after ${new Date(this.lastFailTime + this.recoveryTimeout).toISOString()}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (fallback && this.state === 'OPEN') {
        console.log('Operation failed and circuit breaker is now OPEN, using fallback');
        return await fallback();
      }
      
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.failures = 0;
      if (this.failures === 0) { // First success in HALF_OPEN
        this.state = 'CLOSED';
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): { state: string; failures: number; nextRetry?: string } {
    const result: any = {
      state: this.state,
      failures: this.failures
    };
    
    if (this.state === 'OPEN') {
      result.nextRetry = new Date(this.lastFailTime + this.recoveryTimeout).toISOString();
    }
    
    return result;
  }
}

// Main service class
export class ImprovedGoCardlessService {
  private tokenManager = TokenManager.getInstance();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new GoCardlessCircuitBreaker();
  private client: any = null;

  async initializeClient(): Promise<void> {
    if (!this.client) {
      this.client = await createGoCardlessClient();
    }
    
    // Get valid token
    const token = await this.tokenManager.getValidToken();
    this.client.setToken(token);
  }

  /**
   * Fetches transactions with improved error handling and fallbacks
   */
  async fetchAndStoreTransactions(options: {
    forceRefresh?: boolean;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<{ success: boolean; transactionCount: number; errors: string[] }> {
    const errors: string[] = [];
    let totalTransactions = 0;

    try {
      const requisitions = await getRequisitions();
      
      if (requisitions.length === 0) {
        return { success: true, transactionCount: 0, errors: ['No requisitions found'] };
      }

      await this.initializeClient();

      // Process requisitions with concurrent limit
      const concurrencyLimit = 3; // Prevent overwhelming the API
      const batches = this.chunkArray(requisitions, concurrencyLimit);

      for (const batch of batches) {
        const batchPromises = batch.map(async (requisition) => {
          try {
            const transactions = await this.fetchTransactionsForRequisition(
              requisition,
              options
            );
            
            if (transactions.length > 0) {
              await transactionService.batchInsertTransactions(transactions, requisition.requisitionId);
              totalTransactions += transactions.length;
            }
            
            return transactions.length;
          } catch (error) {
            const errorMsg = `Failed to fetch transactions for ${requisition.bankName}: ${error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
            return 0;
          }
        });

        // Wait for current batch to complete before starting next
        await Promise.allSettled(batchPromises);
        
        // Small delay between batches to be respectful to the API
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: errors.length < requisitions.length, // Success if at least some worked
        transactionCount: totalTransactions,
        errors
      };

    } catch (error) {
      const errorMsg = `Critical error in fetchAndStoreTransactions: ${error}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      
      return {
        success: false,
        transactionCount: totalTransactions,
        errors
      };
    }
  }

  private async fetchTransactionsForRequisition(
    requisition: { requisitionId: string; bankName: string },
    options: { dateFrom?: string; dateTo?: string }
  ): Promise<Transaction[]> {
    
    return await this.circuitBreaker.execute(
      async () => {
        // Check rate limit
        await this.rateLimiter.checkRateLimit();
        
        // Get accounts for this requisition
        const accounts = await this.getAccountsForRequisition(requisition.requisitionId);
        
        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts found for requisition ${requisition.requisitionId}`);
        }

        // Fetch transactions for all accounts
        const allTransactions: Transaction[] = [];
        
        for (const accountId of accounts) {
          try {
            await this.rateLimiter.checkRateLimit();
            
            const account = this.client.account(accountId);
            const response = await account.getTransactions({
              dateFrom: options.dateFrom,
              dateTo: options.dateTo || new Date().toISOString().split('T')[0]
            });
            
            const transactions = [
              ...(response.transactions.booked || []),
              ...(response.transactions.pending || [])
            ];
            
            // Process and categorize transactions
            const processedTransactions = await this.processTransactions(
              transactions,
              requisition.bankName
            );
            
            allTransactions.push(...processedTransactions);
            
          } catch (accountError) {
            console.error(`Error fetching transactions for account ${accountId}:`, accountError);
            // Continue with other accounts
          }
        }

        return allTransactions;
      },
      // Fallback: return cached transactions
      async () => {
        console.log(`Using cached transactions for ${requisition.bankName} due to API failure`);
        return await transactionService.getTransactionsOptimized(
          [requisition.requisitionId],
          [requisition.bankName],
          { limit: 1000 }
        );
      }
    );
  }

  private async getAccountsForRequisition(requisitionId: string): Promise<string[]> {
    const requisitionData = await this.client.requisition.getRequisitionById(requisitionId);
    return requisitionData.accounts || [];
  }

  private async processTransactions(transactions: any[], bankName: string): Promise<Transaction[]> {
    // Apply business logic, categorization, etc.
    return transactions.map(tx => ({
      transactionId: tx.transactionId || tx.internalTransactionId,
      amount: tx.transactionAmount?.amount || '0',
      currency: tx.transactionAmount?.currency || 'EUR',
      bookingDate: tx.bookingDate,
      bookingDateTime: tx.bookingDateTime || tx.bookingDate,
      Payee: tx.creditorName || tx.debtorName || 'Unknown',
      Bank: bankName,
      Description: tx.remittanceInformationUnstructured || '',
      category: 'Other', // Will be categorized later
      Year: new Date(tx.bookingDate).getFullYear(),
      Month: new Date(tx.bookingDate).getMonth() + 1,
      Week: this.getWeekNumber(new Date(tx.bookingDate)),
      Day: new Date(tx.bookingDate).getDate(),
      DayOfWeek: new Date(tx.bookingDate).getDay(),
    }));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get service health and statistics
   */
  getHealthStatus(): {
    circuitBreaker: any;
    rateLimiter: any;
    tokenValid: boolean;
  } {
    return {
      circuitBreaker: this.circuitBreaker.getState(),
      rateLimiter: this.rateLimiter.getStats(),
      tokenValid: this.tokenManager['token'] !== null && Date.now() < this.tokenManager['tokenExpiry']
    };
  }

  /**
   * Reset circuit breaker (for admin use)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker['state'] = 'CLOSED';
    this.circuitBreaker['failures'] = 0;
  }
}

// Singleton instance
export const goCardlessService = new ImprovedGoCardlessService();

// Legacy compatibility
export async function fetchAndStore(): Promise<void> {
  const result = await goCardlessService.fetchAndStoreTransactions();
  if (!result.success) {
    throw new Error(`Sync failed: ${result.errors.join(', ')}`);
  }
}

export async function getCachedTransactions(requisitionId: string, bankName: string): Promise<Transaction[]> {
  return await transactionService.getTransactionsOptimized([requisitionId], [bankName]);
} 