// FILE: app/api/getBalances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBankData, getCachedBalancesFromAppwrite } from '@/lib/bank.actions'; // Use getBankData which respects schedule
import NodeCache from 'node-cache';

// Server-side memory cache: 5 minutes (shorter than store cache)
const cache = new NodeCache({ stdTTL: 5 * 60 });

export const GET = async (req: NextRequest) => {
    const url = new URL(req.url);
    const refreshParam = url.searchParams.get('refresh') === 'true';
    const cacheKey = 'bankDataBalances'; // Single key for all balances

    // Check memory cache first unless refreshing
    if (!refreshParam) {
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            console.log('API: Returning cached bank balances from NodeCache.');
            return NextResponse.json(cachedData);
        }
    } else {
        console.log('API: Force refresh requested for balances.');
    }

    try {
        // Call getBankData - it handles caching, scheduling, and rate limits internally
        // Pass forceRefresh if needed (getBankData needs to be updated to accept this)
        // For now, rely on getBankData's internal logic which calls getBalances(respecting schedule)
        const bankData = await getBankData(); // This fetches balances for *all* requisitions

        // Store the combined bank data in server cache
        cache.set(cacheKey, bankData);

        // Set browser cache header
        const headers = new Headers();
        // Cache balances less aggressively in browser than transactions
        headers.set('Cache-Control', 'public, max-age=60'); // 1 minute

        return NextResponse.json(bankData, { headers });

    } catch (error) {
        console.error('API Error fetching balances:', error);
        // Fallback to Appwrite cache if direct fetch fails
        try {
           console.warn("API Error: Falling back to Appwrite cached balances.");
           const appwriteCachedData = await getCachedBalancesFromAppwrite();
           if (appwriteCachedData && appwriteCachedData.length > 0) {
               cache.set(cacheKey, appwriteCachedData); // Update server cache with fallback data
               return NextResponse.json(appwriteCachedData);
           }
        } catch (cacheError) {
             console.error("API Error: Failed to retrieve Appwrite cache as fallback:", cacheError)
        }
        // Final fallback if everything fails
        return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }
};