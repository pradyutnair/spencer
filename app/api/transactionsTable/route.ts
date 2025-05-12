import { NextRequest, NextResponse } from 'next/server';
import { getGCTransactions, getRequisitions, getSyncStatus } from '@/lib/bank.actions';
import { pullTransactionsDB } from '@/lib/db.actions';

export const GET = async (req: NextRequest) => {
    try {
        // Get the requisition details including requisitionId
        const requisitionData = await getRequisitions();

        // Initialize an empty array to hold all transactions
        let allTransactions: any[] = [];

        // Fetch transactions for each requisition from Appwrite
        for (const { requisitionId, bankName } of requisitionData) {
            // Console log the requisitionId
            console.log('Fetching transactions for Requisition ID:', requisitionId);
            
            // Get all transactions for a requisition from Appwrite
            const transactions = await pullTransactionsDB(requisitionId, bankName);
            
            // Concatenate the transactions to the allTransactions array
            allTransactions = allTransactions.concat(transactions);
        }

        // Check if we should sync with GoCardless (this happens in the background)
        const syncStatus = await getSyncStatus();
        if (syncStatus.transactions.canSyncNow) {
            console.log('Starting background sync with GoCardless for updated transactions');
            
            // Schedule getGCTransactions to run in the background with all requisitions
            // This will respect the sync schedule internally
            const requisitionIds = requisitionData.map(r => r.requisitionId);
            const bankNames = requisitionData.map(r => r.bankName);
            
            setImmediate(async () => {
                try {
                    await getGCTransactions({
                        requisitionIds,
                        bankNames,
                    });
                } catch (error) {
                    console.error('Error in background transaction sync:', error);
                }
            });
        } else {
            console.log(
                `Skipping GoCardless sync - next sync available in ${Math.round(syncStatus.transactions.timeUntilNextSync / 60000)} minutes`
            );
        }

        // Return the transactions as the response body
        return NextResponse.json(allTransactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Error fetching transactions' },
            { status: 500 }
        );
    }
};
