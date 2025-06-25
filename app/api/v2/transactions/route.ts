import { NextRequest, NextResponse } from 'next/server';
import { getRequisitions } from '@/lib/bank.actions';
import { transactionService } from '@/lib/db.actions.improved';
import { z } from 'zod';

// Request validation schema
const TransactionQuerySchema = z.object({
  source: z.enum(['cache', 'fresh', 'auto']).optional().default('auto'),
  refresh: z.boolean().optional().default(false),
  bankGrouping: z.boolean().optional().default(true),
  limit: z.number().min(1).max(10000).optional().default(5000),
  offset: z.number().min(0).optional().default(0),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  bankNames: z.array(z.string()).optional(),
});

// Response caching with Redis-like interface (using in-memory for now)
class ResponseCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly TTL = 15 * 60 * 1000; // 15 minutes

  set(key: string, data: any, ttl = this.TTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const responseCache = new ResponseCache();

// Background sync queue
class SyncQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  add(task: () => Promise<void>): void {
    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        await task();
      } catch (error) {
        console.error('Background sync task failed:', error);
      }
    }
    this.isProcessing = false;
  }
}

const syncQueue = new SyncQueue();

// Circuit breaker for external API calls
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailTime) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }

  getState(): { failures: number; isOpen: boolean } {
    return {
      failures: this.failures,
      isOpen: this.isOpen()
    };
  }
}

const circuitBreaker = new CircuitBreaker();

export const GET = async (req: NextRequest) => {
  const startTime = Date.now();
  
  try {
    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Convert string booleans and numbers
    const processedParams = {
      ...queryParams,
      refresh: queryParams.refresh === 'true',
      bankGrouping: queryParams.bankGrouping !== 'false',
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      bankNames: queryParams.bankNames ? queryParams.bankNames.split(',') : undefined,
    };

    const validatedQuery = TransactionQuerySchema.parse(processedParams);
    
    // Generate cache key
    const cacheKey = `transactions:${JSON.stringify(validatedQuery)}`;
    
    // Handle cache-only requests
    if (validatedQuery.source === 'cache') {
      const cachedData = responseCache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          metadata: { source: 'cache', cached: true }
        });
      }
      return NextResponse.json(
        { error: 'No cached data available' },
        { status: 404 }
      );
    }

    // Check cache first (unless refresh requested)
    if (!validatedQuery.refresh && validatedQuery.source !== 'fresh') {
      const cachedData = responseCache.get(cacheKey);
      if (cachedData) {
        // Schedule background refresh
        if (validatedQuery.source === 'auto') {
          syncQueue.add(async () => {
            try {
              await refreshTransactionData(validatedQuery, cacheKey);
            } catch (error) {
              console.error('Background refresh failed:', error);
            }
          });
        }
        
        return NextResponse.json({
          ...cachedData,
          metadata: { 
            source: 'cache', 
            cached: true,
            backgroundRefresh: validatedQuery.source === 'auto'
          }
        });
      }
    }

    // Fetch fresh data
    const responseData = await circuitBreaker.execute(async () => {
      return await fetchTransactionData(validatedQuery);
    });

    // Cache the response
    responseCache.set(cacheKey, responseData);

    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...responseData,
      metadata: {
        source: 'fresh',
        cached: false,
        processingTime,
        circuitBreaker: circuitBreaker.getState()
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
        'X-Processing-Time': processingTime.toString()
      }
    });

  } catch (error) {
    console.error('Error in transactions API:', error);
    
    // Try to return cached data as fallback
    const fallbackKey = `transactions:${JSON.stringify({ source: 'cache' })}`;
    const fallbackData = responseCache.get(fallbackKey);
    
    if (fallbackData) {
      return NextResponse.json({
        ...fallbackData,
        metadata: { 
          source: 'fallback',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          circuitBreaker: circuitBreaker.getState()
        }
      },
      { status: 500 }
    );
  }
};

async function fetchTransactionData(query: z.infer<typeof TransactionQuerySchema>) {
  // Get requisitions
  const requisitions = await getRequisitions();
  
  if (requisitions.length === 0) {
    return { transactions: [], banks: {}, count: 0 };
  }

  // Filter requisitions by bankNames if specified
  const filteredRequisitions = query.bankNames 
    ? requisitions.filter(req => query.bankNames!.includes(req.bankName))
    : requisitions;

  const requisitionIds = filteredRequisitions.map(r => r.requisitionId);
  const bankNames = filteredRequisitions.map(r => r.bankName);

  // Fetch transactions using optimized service
  const transactions = await transactionService.getTransactionsOptimized(
    requisitionIds,
    bankNames,
    {
      excludeFiltered: true,
      limit: query.limit,
      offset: query.offset,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    }
  );

  // Format response based on grouping preference
  if (query.bankGrouping) {
    const bankTransactions: Record<string, any[]> = {};
    
    transactions.forEach(transaction => {
      const bankName = transaction.Bank || 'Unknown';
      const normalizedBankName = bankName.replace(/_/g, ' ').split(' ')[0];
      
      if (!bankTransactions[normalizedBankName]) {
        bankTransactions[normalizedBankName] = [];
      }
      bankTransactions[normalizedBankName].push(transaction);
    });

    return {
      bankTransactions,
      count: transactions.length,
      banks: Object.keys(bankTransactions)
    };
  } else {
    return {
      transactions,
      count: transactions.length
    };
  }
}

async function refreshTransactionData(
  query: z.infer<typeof TransactionQuerySchema>, 
  cacheKey: string
): Promise<void> {
  try {
    const freshData = await fetchTransactionData(query);
    responseCache.set(cacheKey, freshData);
    console.log(`Background refresh completed for cache key: ${cacheKey}`);
  } catch (error) {
    console.error('Background refresh failed:', error);
  }
}

// Health check endpoint
export const HEAD = async () => {
  const health = {
    status: 'healthy',
    circuitBreaker: circuitBreaker.getState(),
    cacheSize: responseCache['cache'].size,
    timestamp: new Date().toISOString()
  };
  
  return new Response(null, {
    status: 200,
    headers: { 'X-Health': JSON.stringify(health) }
  });
}; 