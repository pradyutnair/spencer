import { NextRequest, NextResponse } from 'next/server';
import { getBudgetData } from '@/lib/bank.actions';

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    // Fetch the budget data
    const budgetData = await getBudgetData();

    // Return the budget data as the response body
    return NextResponse.json(budgetData);

  } catch (error) {
    console.error('Error fetching balances:', error);
    return new Response(JSON.stringify({ status: 500, body: 'Error fetching balances' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};