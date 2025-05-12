import { NextRequest, NextResponse } from 'next/server';
import { getRequisitions } from '@/lib/bank.actions';
import { getCachedTransactions } from '@/lib/services/gocardlessService';

export const GET = async (req: NextRequest) => {
  try {
    const requisitions = await getRequisitions();
    let transactionMap = new Map();

    // First, collect all transactions from all requisitions
    for (const { requisitionId, bankName } of requisitions) {
      const txs = await getCachedTransactions(requisitionId, bankName);
      
      // Add each transaction to the map with a unique key
      for (const tx of txs) {
        const uniqueKey = tx.$id || `${tx.Payee}_${tx.amount}_${tx.bookingDate}_${tx.Bank}`;
        
        // If we already have this transaction, skip it unless it's a more specific match
        if (!transactionMap.has(uniqueKey) || 
            (tx.requisitionId === requisitionId && 
             transactionMap.get(uniqueKey).requisitionId !== requisitionId)) {
          transactionMap.set(uniqueKey, tx);
        }
      }
    }

    // Convert the map values to an array
    const allTransactions = Array.from(transactionMap.values());
    
    // Sort by date (most recent first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.bookingDateTime || a.bookingDate);
      const dateB = new Date(b.bookingDateTime || b.bookingDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error('Error in GET /api/gocardless/transactions:', error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
};
