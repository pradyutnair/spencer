import { NextRequest, NextResponse } from 'next/server';
import { getBankData, getSyncStatus } from '@/lib/bank.actions';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

export const GET = async (req: NextRequest) => {
  try {
    const cacheKey = 'bankData';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log('Returning cached bank data from NodeCache');
      return NextResponse.json(cachedData);
    }

    // Fetch the bank data
    // This now internally respects our sync schedule and uses Appwrite for recent data
    const bankData = await getBankData();

    // Store the bank data in cache
    cache.set(cacheKey, bankData);

    // Log sync status for informational purposes
    const syncStatus = await getSyncStatus();
    if (!syncStatus.balances.canSyncNow) {
      console.log(
        `Next GoCardless balances sync available in ${Math.round(syncStatus.balances.timeUntilNextSync / 60000)} minutes`
      );
    }

    // Return the bank data as the response body
    return NextResponse.json(bankData);
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json({ error: 'Error fetching balances' }, { status: 500 });
  }
};