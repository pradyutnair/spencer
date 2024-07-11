import { NextRequest, NextResponse } from 'next/server';
import { getBankData } from '@/lib/bank.actions';

export const GET = async (req: NextRequest) => {
  try {
    // Fetch the bank data
    const bankData = await getBankData();
    console.log('Bank data:', bankData);

    // Return the bank data as the response body
    return NextResponse.json(bankData);

  } catch (error) {
    console.error('Error fetching balances:', error);
    return {
      status: 500,
      body: 'Error fetching balances',
    };
  }
};