import { NextRequest, NextResponse } from 'next/server';
import { getBudgetData } from '@/lib/bank.actions';

export const GET = async (req: NextRequest) => {
  try {
    // Fetch the budget data
    const budgetData = await getBudgetData()

    // Return the bank data as the response body
    return NextResponse.json(budgetData);

  } catch (error) {
    console.error('Error fetching balances:', error);
    return {
      status: 500,
      body: 'Error fetching balances',
    };
  }
};