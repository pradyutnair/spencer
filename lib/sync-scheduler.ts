import { createAdminClient } from '@/lib/appwrite';
import { ID, Query } from 'node-appwrite';

const SYNCS_PER_DAY = 4;
// Default to 'sync_schedule' if not specified in env variables
const SYNC_COLLECTION_ID = process.env.APPWRITE_SYNC_COLLECTION_ID || 'sync_schedule';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const MS_PER_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MS_BETWEEN_SYNCS = MS_PER_DAY / SYNCS_PER_DAY; // Time between syncs in milliseconds

// In-memory cache for last sync time
const inMemorySyncCache = {
  transactions: 0, // timestamp of last sync
  balances: 0      // timestamp of last sync
};

// Function to check if it's time to sync
export async function shouldSyncNow(syncType: 'transactions' | 'balances'): Promise<boolean> {
  try {
    if (!DATABASE_ID) {
      console.warn('DATABASE_ID not set, defaulting to sync allowed');
      return true;
    }

    const { database } = await createAdminClient();
    
    // First check in-memory cache to avoid unnecessary DB calls
    const lastSyncTime = inMemorySyncCache[syncType];
    if (lastSyncTime > 0) {
      const currentTime = Date.now();
      return currentTime - lastSyncTime > MS_BETWEEN_SYNCS;
    }

    // Only try to access the database if we have a collection ID
    if (SYNC_COLLECTION_ID) {
      try {
        // Get the last sync record for this type
        const syncRecords = await database.listDocuments(
          DATABASE_ID,
          SYNC_COLLECTION_ID,
          [
            Query.equal('syncType', syncType),
            Query.orderDesc('$createdAt'),
            Query.limit(1)
          ]
        );

        // If no record found, it's time to sync
        if (!syncRecords.documents.length) {
          return true;
        }

        // Get the last sync time
        const lastSyncTime = new Date(syncRecords.documents[0].$createdAt).getTime();
        const currentTime = Date.now();
        
        // Update in-memory cache
        inMemorySyncCache[syncType] = lastSyncTime;
        
        // If it's been at least MS_BETWEEN_SYNCS since the last sync, it's time to sync
        return currentTime - lastSyncTime > MS_BETWEEN_SYNCS;
      } catch (error) {
        console.error(`Error checking sync schedule for ${syncType}:`, error);
        // In case of DB error, use in-memory cache or default to allowing sync
        if (inMemorySyncCache[syncType] > 0) {
          const currentTime = Date.now();
          return currentTime - inMemorySyncCache[syncType] > MS_BETWEEN_SYNCS;
        }
        return true;
      }
    } else {
      console.warn('SYNC_COLLECTION_ID not set, defaulting to sync allowed. Please set this in your environment variables.');
      return true;
    }
  } catch (error) {
    console.error(`Error in shouldSyncNow for ${syncType}:`, error);
    return true;
  }
}

// Function to record a sync has occurred
export async function recordSync(syncType: 'transactions' | 'balances'): Promise<void> {
  try {
    // Always update in-memory cache
    inMemorySyncCache[syncType] = Date.now();
    
    // Only try to write to DB if we have both DATABASE_ID and SYNC_COLLECTION_ID
    if (!DATABASE_ID || !SYNC_COLLECTION_ID) {
      console.warn('DATABASE_ID or SYNC_COLLECTION_ID not set, sync recorded only in memory');
      return;
    }
    
    const { database } = await createAdminClient();
    
    try {
      await database.createDocument(
        DATABASE_ID,
        SYNC_COLLECTION_ID,
        ID.unique(),
        {
          syncType,
          timestamp: new Date().toISOString(),
        }
      );
      
      console.log(`${syncType} sync recorded at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`Error recording ${syncType} sync in database:`, error);
      // Already updated in-memory cache, so we're still good
    }
  } catch (error) {
    console.error(`Error in recordSync for ${syncType}:`, error);
  }
}

// Function to get the time until next sync is allowed
export async function getTimeUntilNextSync(syncType: 'transactions' | 'balances'): Promise<number> {
  try {
    // First check in-memory cache
    const lastSyncTime = inMemorySyncCache[syncType];
    if (lastSyncTime > 0) {
      const currentTime = Date.now();
      const timePassedSinceLastSync = currentTime - lastSyncTime;
      
      if (timePassedSinceLastSync >= MS_BETWEEN_SYNCS) {
        return 0; // It's already time to sync
      }
      
      return MS_BETWEEN_SYNCS - timePassedSinceLastSync;
    }
    
    // If we don't have a valid DATABASE_ID or SYNC_COLLECTION_ID, allow sync immediately
    if (!DATABASE_ID || !SYNC_COLLECTION_ID) {
      console.warn('DATABASE_ID or SYNC_COLLECTION_ID not set, defaulting to sync allowed now');
      return 0;
    }
    
    const { database } = await createAdminClient();
    
    try {
      const syncRecords = await database.listDocuments(
        DATABASE_ID,
        SYNC_COLLECTION_ID,
        [
          Query.equal('syncType', syncType),
          Query.orderDesc('$createdAt'),
          Query.limit(1)
        ]
      );
      
      if (!syncRecords.documents.length) {
        return 0; // No records, sync is allowed immediately
      }
      
      const lastSyncTime = new Date(syncRecords.documents[0].$createdAt).getTime();
      const currentTime = Date.now();
      const timePassedSinceLastSync = currentTime - lastSyncTime;
      
      // Update in-memory cache
      inMemorySyncCache[syncType] = lastSyncTime;
      
      if (timePassedSinceLastSync >= MS_BETWEEN_SYNCS) {
        return 0; // It's already time to sync
      }
      
      return MS_BETWEEN_SYNCS - timePassedSinceLastSync;
    } catch (error) {
      console.error(`Error calculating time until next ${syncType} sync:`, error);
      // Default to "now" if there's an error
      return 0;
    }
  } catch (error) {
    console.error(`Error in getTimeUntilNextSync for ${syncType}:`, error);
    return 0;
  }
}