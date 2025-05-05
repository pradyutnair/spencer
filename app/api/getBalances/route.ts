import { NextRequest, NextResponse } from 'next/server';
import { getBankData, getSyncStatus, getCachedBalancesFromAppwrite } from '@/lib/bank.actions';
import NodeCache from 'node-cache';

// Increase memory cache duration to reduce load on both Appwrite and GoCardless
const cache = new NodeCache({ stdTTL: 60 * 60 }); // Cache for 1 hour (3600 seconds)

// Track sync attempts to prevent excessive API calls
const syncAttemptTracker = {
  lastSyncAttempt: 0,
  minInterval: 60000 * 15, // 15 minutes minimum between sync attempts
  isCurrentlySyncing: false
};

export const GET = async (req: NextRequest) => {
  try {
    // Check memory cache first (fastest)
    const cacheKey = 'bankData';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log('Returning cached bank data from NodeCache');
      
      // Maybe trigger a background refresh if it's been a while, but don't wait for results
      triggerBackgroundSyncIfNeeded().catch(e => console.log('Background sync error:', e));
      
      return NextResponse.json(cachedData);
    }

    // If not in memory cache, try to load directly from Appwrite
    // This avoids hitting GoCardless entirely if possible
    const appwriteBankData = await getCachedBalancesFromAppwrite();
    
    if (appwriteBankData && appwriteBankData.length > 0) {
      console.log('Found data in Appwrite cache, returning without GoCardless API call');
      // Store in memory cache for next time
      cache.set(cacheKey, appwriteBankData);
      
      // Maybe trigger a background refresh, but don't wait for results
      triggerBackgroundSyncIfNeeded().catch(e => console.log('Background sync error:', e));
      
      return NextResponse.json(appwriteBankData);
    }

    // As a last resort, if we have no data at all, fetch from GoCardless
    // This should only happen on first run or if cache was cleared
    console.log('No cached data available, fetching from GoCardless (this should be rare)');
    const bankData = await getBankData();

    // Store the bank data in cache
    cache.set(cacheKey, bankData);

    // Return the bank data as the response body
    return NextResponse.json(bankData);
  } catch (error) {
    console.error('Error fetching balances:', error);
    
    // If there's an error but we have cached data, return that instead
    const cachedFallback = cache.get('bankData');
    if (cachedFallback) {
      console.log('Error occurred but returning cached data as fallback');
      return NextResponse.json(cachedFallback);
    }
    
    return NextResponse.json({ error: 'Error fetching balances' }, { status: 500 });
  }
};

// Function to potentially trigger a background sync without blocking
async function triggerBackgroundSyncIfNeeded() {
  const now = Date.now();
  
  // Prevent multiple syncs running at once or too frequently
  if (syncAttemptTracker.isCurrentlySyncing || 
      now - syncAttemptTracker.lastSyncAttempt < syncAttemptTracker.minInterval) {
    return;
  }
  
  const syncStatus = await getSyncStatus();
  
  if (syncStatus.balances.canSyncNow) {
    syncAttemptTracker.isCurrentlySyncing = true;
    syncAttemptTracker.lastSyncAttempt = now;
    
    setTimeout(async () => {
      try {
        console.log('Starting background balance sync');
        const freshBankData = await getBankData();
        
        // Update cache with new data
        cache.set('bankData', freshBankData);
        console.log('Background balance sync completed and cache updated');
      } catch (error) {
        console.error('Background balance sync failed:', error);
      } finally {
        syncAttemptTracker.isCurrentlySyncing = false;
      }
    }, 100); // Small delay to ensure response is sent first
  } else {
    console.log(
      `Skipping background GoCardless sync - next sync available in ${Math.round(syncStatus.balances.timeUntilNextSync / 60000)} minutes`
    );
  }
}