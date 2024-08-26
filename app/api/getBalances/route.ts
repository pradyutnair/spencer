import { NextRequest, NextResponse } from 'next/server';
import { getBankData } from '@/lib/bank.actions';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

export const GET = async (req: NextRequest) => {
  try {
    const cacheKey = 'bankData';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log('Returning cached bank data');
      return NextResponse.json(cachedData);
    }

    // Fetch the bank data
    const bankData = await getBankData();

    // Store the bank data in cache
    cache.set(cacheKey, bankData);

    // Return the bank data as the response body
    return NextResponse.json(bankData);
  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json({ error: 'Error fetching balances' }, { status: 500 });
  }
};