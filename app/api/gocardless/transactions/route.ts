import { NextRequest, NextResponse } from 'next/server';
import { getRequisitions } from '@/lib/bank.actions';
import { getCachedTransactions } from '@/lib/services/gocardlessService';

export const GET = async (req: NextRequest) => {
  try {
    const requisitions = await getRequisitions();
    let allTransactions: any[] = [];

    for (const { requisitionId } of requisitions) {
      const txs = await getCachedTransactions(requisitionId);
      allTransactions = allTransactions.concat(txs);
    }
    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error('Error in GET /api/gocardless/transactions:', error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
};
