// FILE: lib/sync-scheduler.ts
import { createAdminClient } from '@/lib/appwrite';
import { ID, Query } from 'node-appwrite';

// Configurable sync frequencies (adjust as needed, lower numbers mean more frequent)
const SYNCS_PER_DAY = {
  transactions: parseInt(process.env.TRANSACTION_SYNCS_PER_DAY || '4', 10), // e.g., Every 6 hours
  balances: parseInt(process.env.BALANCE_SYNCS_PER_DAY || '12', 10),        // e.g., Every 2 hours
};

const SYNC_COLLECTION_ID = process.env.APPWRITE_SYNC_COLLECTION_ID || 'sync_schedule';
const RATE_LIMIT_COLLECTION_ID = process.env.APPWRITE_RATE_LIMIT_COLLECTION_ID || 'rate_limits';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Calculate interval based on syncs per day
const getMsBetweenSyncs = (syncType: 'transactions' | 'balances'): number => {
  const syncs = SYNCS_PER_DAY[syncType];
  return syncs > 0 ? MS_PER_DAY / syncs : MS_PER_DAY * 365; // Effectively disable if 0
};

// In-memory cache for last sync time (avoids DB lookup for recent syncs)
const inMemorySyncCache: Record<string, number> = {}; // { 'transactions': timestamp, 'balances': timestamp }
const inMemoryRateLimitCache = { expiresAt: 0 }; // Cache rate limit expiry

// Adds a small random variation to sync times to distribute load
function addJitter(ms: number): number {
  const jitterPercent = 0.05; // 5% jitter
  const jitterAmount = ms * jitterPercent;
  return ms + (Math.random() * jitterAmount * 2 - jitterAmount);
}

// Check if GoCardless API is currently rate limited
async function checkRateLimitState(): Promise<{ limited: boolean, expiresAt: number }> {
  const now = Date.now();

  // Check in-memory cache first
  if (inMemoryRateLimitCache.expiresAt > now) {
    console.log(`Rate limit check (memory cache): Limited until ${new Date(inMemoryRateLimitCache.expiresAt).toISOString()}`);
    return { limited: true, expiresAt: inMemoryRateLimitCache.expiresAt };
  }

  if (!DATABASE_ID || !RATE_LIMIT_COLLECTION_ID) {
    console.warn('Rate limit check skipped: DATABASE_ID or RATE_LIMIT_COLLECTION_ID not set.');
    return { limited: false, expiresAt: 0 };
  }

  try {
    const { database } = await createAdminClient();
    const rateLimits = await database.listDocuments(
      DATABASE_ID,
      RATE_LIMIT_COLLECTION_ID,
      [
        Query.equal('service', 'gocardless'),
        Query.greaterThan('expiresAt', new Date().toISOString()), // Find entries where expiry is in the future
        Query.orderDesc('expiresAt'), // Get the latest expiry time
        Query.limit(1)
      ]
    );

    if (rateLimits.documents.length > 0) {
      const expiryTime = new Date(rateLimits.documents[0].expiresAt).getTime();
      // Update memory cache
      inMemoryRateLimitCache.expiresAt = expiryTime;
      console.log(`Rate limit check (DB): Limited until ${new Date(expiryTime).toISOString()}`);
      return { limited: true, expiresAt: expiryTime };
    }

    // Not rate limited, clear memory cache expiry
    inMemoryRateLimitCache.expiresAt = 0;
    return { limited: false, expiresAt: 0 };
  } catch (error) {
    console.error('Error checking rate limit state from DB:', error);
    // Assume not rate limited if check fails to avoid blocking unnecessarily
    return { limited: false, expiresAt: 0 };
  }
}

// Function to check if it's time to sync, considering rate limits
export async function shouldSyncNow(syncType: 'transactions' | 'balances'): Promise<boolean> {
  // 1. Check Rate Limit Status
  const rateLimitStatus = await checkRateLimitState();
  if (rateLimitStatus.limited) {
    console.log(`Sync blocked for ${syncType}: Rate limit active until ${new Date(rateLimitStatus.expiresAt).toISOString()}.`);
    return false;
  }

  // 2. Check Sync Schedule
  const MS_BETWEEN_SYNCS = getMsBetweenSyncs(syncType);
  const lastSyncMemory = inMemorySyncCache[syncType] || 0;
  const now = Date.now();

  // Use memory cache if recent enough
  if (lastSyncMemory > 0 && (now - lastSyncMemory) < MS_BETWEEN_SYNCS) {
     console.log(`Sync check (memory): Not time to sync ${syncType} yet. Last sync: ${new Date(lastSyncMemory).toISOString()}`);
     return false;
  }

  // Fallback to DB check if memory cache is old or empty
  if (!DATABASE_ID || !SYNC_COLLECTION_ID) {
    console.warn(`Sync schedule check skipped for ${syncType}: DATABASE_ID or SYNC_COLLECTION_ID not set. Allowing sync.`);
    return true;
  }

  try {
    const { database } = await createAdminClient();
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
      console.log(`Sync check (DB): No previous sync record for ${syncType}, syncing now.`);
      return true; // First sync for this type
    }

    const lastSyncDb = new Date(syncRecords.documents[0].$createdAt).getTime();
    inMemorySyncCache[syncType] = lastSyncDb; // Update memory cache

    const timePassed = now - lastSyncDb;
    const shouldSync = timePassed >= addJitter(MS_BETWEEN_SYNCS); // Add jitter

    if (shouldSync) {
      console.log(`Sync check (DB): Time to sync ${syncType}. Last sync: ${new Date(lastSyncDb).toISOString()}`);
    } else {
      const timeRemaining = MS_BETWEEN_SYNCS - timePassed;
      console.log(`Sync check (DB): Not time to sync ${syncType} yet. Last sync: ${new Date(lastSyncDb).toISOString()}. Wait ${Math.round(timeRemaining / 60000)} min.`);
    }
    return shouldSync;

  } catch (error) {
    console.error(`Error checking sync schedule from DB for ${syncType}:`, error);
    // Allow sync if DB check fails to avoid getting stuck
    return true;
  }
}

// Function to record a sync has occurred
export async function recordSync(syncType: 'transactions' | 'balances'): Promise<void> {
  const now = Date.now();
  const currentTimeISO = new Date(now).toISOString();

  // Always update in-memory cache immediately
  inMemorySyncCache[syncType] = now;
  console.log(`Sync recorded (memory) for ${syncType} at ${currentTimeISO}`);

  if (!DATABASE_ID || !SYNC_COLLECTION_ID) {
    console.warn(`Sync record skipped (DB) for ${syncType}: DATABASE_ID or SYNC_COLLECTION_ID not set.`);
    return;
  }

  try {
    const { database } = await createAdminClient();
    await database.createDocument(
      DATABASE_ID,
      SYNC_COLLECTION_ID,
      ID.unique(),
      {
        syncType,
        timestamp: currentTimeISO, // Use consistent ISO timestamp
      }
    );
    console.log(`Sync recorded (DB) for ${syncType} at ${currentTimeISO}`);

    // Optional: Clean up old records (consider running this less frequently if performance is an issue)
    // cleanupOldSyncRecords(database, syncType);

  } catch (error) {
    console.error(`Error recording sync in database for ${syncType}:`, error);
  }
}

// Function to get the estimated time until the next sync is allowed (in milliseconds)
export async function getTimeUntilNextSync(syncType: 'transactions' | 'balances'): Promise<number> {
  // 1. Check Rate Limit First
   const rateLimitStatus = await checkRateLimitState();
   if (rateLimitStatus.limited) {
     return Math.max(0, rateLimitStatus.expiresAt - Date.now());
   }

  // 2. Check Sync Schedule
  const MS_BETWEEN_SYNCS = getMsBetweenSyncs(syncType);
  const lastSyncMemory = inMemorySyncCache[syncType] || 0;
  const now = Date.now();

  // Prioritize memory cache
  if (lastSyncMemory > 0) {
    const timePassed = now - lastSyncMemory;
    return Math.max(0, MS_BETWEEN_SYNCS - timePassed);
  }

  // Fallback to DB
  if (!DATABASE_ID || !SYNC_COLLECTION_ID) return 0; // Allow immediately if no config

  try {
    const { database } = await createAdminClient();
    const syncRecords = await database.listDocuments(
      DATABASE_ID,
      SYNC_COLLECTION_ID,
      [Query.equal('syncType', syncType), Query.orderDesc('$createdAt'), Query.limit(1)]
    );

    if (!syncRecords.documents.length) return 0; // Allow immediately if no record

    const lastSyncDb = new Date(syncRecords.documents[0].$createdAt).getTime();
    inMemorySyncCache[syncType] = lastSyncDb; // Update cache
    const timePassed = now - lastSyncDb;
    return Math.max(0, MS_BETWEEN_SYNCS - timePassed);

  } catch (error) {
    console.error(`Error getting time until next sync for ${syncType}:`, error);
    return 0; // Allow immediately on error
  }
}

// Function to record a rate limit hit
export async function recordRateLimit(resetSeconds: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + resetSeconds * 1000;
    const expiresAtISO = new Date(expiresAt).toISOString();
    const hitAtISO = new Date(now).toISOString();

    // Update in-memory cache immediately
    inMemoryRateLimitCache.expiresAt = expiresAt;
    console.log(`Rate limit recorded (memory). Expires at: ${expiresAtISO}`);

    if (!DATABASE_ID || !RATE_LIMIT_COLLECTION_ID) {
        console.warn('Rate limit record skipped (DB): DATABASE_ID or RATE_LIMIT_COLLECTION_ID not set.');
        return;
    }

    try {
        const { database } = await createAdminClient();

        // Optional: Clean up expired rate limit entries before creating a new one
        try {
           const expiredLimits = await database.listDocuments(
             DATABASE_ID,
             RATE_LIMIT_COLLECTION_ID,
             [
               Query.equal('service', 'gocardless'),
               Query.lessThanEqual('expiresAt', new Date().toISOString())
             ]
           );
           for (const doc of expiredLimits.documents) {
             await database.deleteDocument(DATABASE_ID, RATE_LIMIT_COLLECTION_ID, doc.$id);
           }
        } catch(cleanupError) {
            console.warn("Failed to cleanup expired rate limits:", cleanupError)
        }


        await database.createDocument(
            DATABASE_ID,
            RATE_LIMIT_COLLECTION_ID,
            ID.unique(),
            {
                service: 'gocardless',
                hitAt: hitAtISO,
                expiresAt: expiresAtISO,
                resetSeconds: resetSeconds
            }
        );
        console.log(`Rate limit recorded (DB). Expires in ${resetSeconds} seconds at ${expiresAtISO}`);
    } catch (error) {
        console.error('Error recording rate limit in DB:', error);
    }
}

// Optional: Helper function to clean up old sync records
async function cleanupOldSyncRecords(database: any, syncType: string) {
  try {
    const cutoffDate = new Date(Date.now() - 7 * MS_PER_DAY).toISOString(); // Keep 7 days of records
    const oldRecords = await database.listDocuments(
      DATABASE_ID!,
      SYNC_COLLECTION_ID!,
      [
        Query.equal('syncType', syncType),
        Query.lessThan('$createdAt', cutoffDate),
        Query.limit(100) // Process in batches
      ]
    );

    if (oldRecords.documents.length > 0) {
       console.log(`Cleaning up ${oldRecords.documents.length} old sync records for ${syncType}...`);
       const deletePromises = oldRecords.documents.map((doc: any) =>
         database.deleteDocument(DATABASE_ID!, SYNC_COLLECTION_ID!, doc.$id)
       );
       await Promise.allSettled(deletePromises);
    }
  } catch (cleanupError) {
    console.warn(`Error cleaning up old ${syncType} sync records:`, cleanupError);
  }
}