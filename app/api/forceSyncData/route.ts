import { NextRequest, NextResponse } from 'next/server';
import { getGCTransactions, getRequisitions, getBalances, recordSync } from '@/lib/bank.actions';

export async function POST(request: NextRequest) {
  try {
    const { syncType = 'all' } = await request.json();
    const requisitionData = await getRequisitions();
    const requisitionIds = requisitionData.map(r => r.requisitionId);
    const bankNames = requisitionData.map(r => r.bankName);
    
    let syncResults = {
      transactions: false,
      balances: false
    };
    
    // Sync transactions if requested
    if (syncType === 'all' || syncType === 'transactions') {
      try {
        console.log('Forcing transaction sync with GoCardless');
        await getGCTransactions({
          requisitionIds,
          bankNames,
          forceSync: true // Bypass sync schedule
        });
        await recordSync('transactions');
        syncResults.transactions = true;
      } catch (error) {
        console.error('Error forcing transaction sync:', error);
      }
    }
    
    // Sync balances if requested
    if (syncType === 'all' || syncType === 'balances') {
      try {
        console.log('Forcing balance sync with GoCardless');
        for (const requisitionId of requisitionIds) {
          await getBalances({ 
            requisitionIds: [requisitionId]
          });
        }
        await recordSync('balances');
        syncResults.balances = true;
      } catch (error) {
        console.error('Error forcing balance sync:', error);
      }
    }
    
    return NextResponse.json({
      success: syncResults.transactions || syncResults.balances,
      message: 'Sync operation completed',
      details: syncResults
    });
  } catch (error) {
    console.error('Error in force sync:', error);
    return NextResponse.json(
      { error: 'Error forcing data synchronization' },
      { status: 500 }
    );
  }
}