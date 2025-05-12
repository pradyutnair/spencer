import { NextRequest, NextResponse } from 'next/server';
import { getGCTransactions, getRequisitions, getSyncStatus } from '@/lib/bank.actions';
import { pullTransactionsDB, pullAllTransactionsDB } from '@/lib/db.actions';
import NodeCache from 'node-cache';

// Extend server-side cache duration for better performance
const transactionsCache = new NodeCache({ stdTTL: 1800 }); // Cache for 30 minutes

export const GET = async (req: NextRequest) => {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const sourceParam = url.searchParams.get('source');
    const refreshParam = url.searchParams.get('refresh') === 'true';
    const bankGroupingParam = url.searchParams.get('bankGrouping') === 'true';

    // If source=cache is specified, return only cached data without any background fetching
    if (sourceParam === 'cache') {
      const cachedTransactions = transactionsCache.get('allTransactions');
      if (cachedTransactions) {
        console.log('Explicitly serving only cached transactions data');
        return NextResponse.json(cachedTransactions);
      }
    }

    // If refresh=true, bypass cache and force new data fetch
    if (!refreshParam) {
      // Check cache first if not forced refresh
      const cacheKey = 'allTransactions';
      const cachedTransactions = transactionsCache.get(cacheKey);
      
      if (cachedTransactions) {
        console.log('Returning cached transactions data');
        
        // Start background sync if needed, but don't wait for it
        setTimeout(() => {
          checkAndTriggerBackgroundSync()
            .catch(err => console.error('Background sync error:', err));
        }, 100);
        
        return NextResponse.json(cachedTransactions);
      }
    } else {
      console.log('Cache bypass requested, fetching fresh transaction data');
    }

    // Get the requisition details including requisitionId
    const requisitionData = await getRequisitions();

    // Initialize a response object - either flat list or grouped by bank
    let responseData: any = bankGroupingParam ? { bankTransactions: {} } : [];

    // Fetch transactions for each requisition from Appwrite
    for (const { requisitionId, bankName } of requisitionData) {
      console.log(`Fetching transactions for ${bankName} (${requisitionId})`);
      
      // Get all transactions for the requisition from Appwrite
      const transactions = await pullTransactionsDB(requisitionId, bankName);
      
      if (bankGroupingParam) {
        // Group by bank name for more efficient client-side processing
        const normalizedBankName = bankName.replace(/_/g, ' ').split(' ')[0];
        responseData.bankTransactions[normalizedBankName] = transactions;
      } else {
        // Legacy format - flat list
        responseData = [...responseData, ...transactions];
      }
    }

    // Store in cache (both formats)
    transactionsCache.set('allTransactions', responseData);
    
    // Set a cache header so browsers can also cache the response
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=600'); // 10 minutes browser cache

    // Start background sync for fresh data without waiting (unless this is already a refresh request)
    if (!refreshParam) {
      setTimeout(() => {
        checkAndTriggerBackgroundSync()
          .catch(err => console.error('Background sync error:', err));
      }, 100);
    }

    // Return the transactions
    return NextResponse.json(responseData, { headers });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    // On error, try to return cached data as fallback
    const cachedTransactions = transactionsCache.get('allTransactions');
    if (cachedTransactions) {
      console.log('Error occurred, returning cached data as fallback');
      return NextResponse.json(cachedTransactions);
    }
    
    return NextResponse.json(
      { error: 'Error fetching transactions' },
      { status: 500 }
    );
  }
};

// Separate function for background sync to avoid blocking the response
async function checkAndTriggerBackgroundSync() {
  const requisitionData = await getRequisitions();
  const syncStatus = await getSyncStatus();
  
  if (syncStatus.transactions.canSyncNow) {
    console.log('Starting background sync with GoCardless for updated transactions');
    
    const requisitionIds = requisitionData.map(r => r.requisitionId);
    const bankNames = requisitionData.map(r => r.bankName);
    
    // Add retry logic with exponential backoff for rate limits
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Setting a small delay before first attempt to prevent rate limiting
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 3000; // Exponential backoff
          console.log(`Retry attempt ${attempt+1} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const freshTransactions = await getGCTransactions({
          requisitionIds,
          bankNames,
        });
        
        if (freshTransactions && freshTransactions.length > 0) {
          // Process the data to match the expected output format
          const responseData: any = { bankTransactions: {} };
          
          // Group transactions by bank
          freshTransactions.forEach(transaction => {
            const bankName = transaction.Bank || 'Unknown';
            if (!responseData.bankTransactions[bankName]) {
              responseData.bankTransactions[bankName] = [];
            }
            responseData.bankTransactions[bankName].push(transaction);
          });
          
          // Update the cache with the new data
          transactionsCache.set('allTransactions', responseData);
          console.log('Successfully synced with GoCardless, cache updated with grouped data');
        }
        
        break;
      } catch (error: any) {
        const isRateLimit = error?.response?.status === 429;
        
        if (isRateLimit && attempt < maxRetries - 1) {
          console.log(`Rate limit hit during sync attempt ${attempt+1}, will retry`);
          continue;
        }
        
        console.error('Error in background transaction sync:', error);
        throw error;
      }
    }
  } else {
    console.log(
      `Skipping GoCardless sync - next sync available in ${Math.round(syncStatus.transactions.timeUntilNextSync / 60000)} minutes`
    );
  }
}