import { NextRequest, NextResponse } from 'next/server';
import { getGCTransactions, getRequisitions } from '@/lib/bank.actions';
import { pullTransactionsDB } from '@/lib/db.actions';

export const GET = async (req: NextRequest) => {
    try {
        // Get the requisition details including requisitionId
        const requisitionData = await getRequisitions();

        // Initialize an empty array to hold all transactions
        let allTransactions: any[] = [];

        for (let { requisitionId, bankName } of requisitionData) {
            // Fetch transactions using the retrieved requisitionId
            const transactions = await pullTransactionsDB(requisitionId);

            // Concatenate the transactions to the allTransactions array
            allTransactions = allTransactions.concat(transactions);

            // Schedule getGCTransactions to run in the background
            setImmediate(async () => {
                try {
                    await getGCTransactions({
                        requisitionIds: [requisitionId],
                        bankNames: [bankName],
                    });
                } catch (error) {
                    console.error('Error updating transactions:', error);
                }
            });
        }

        // Return the transactions as the response body
        return NextResponse.json(allTransactions);

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return {
            status: 500,
            body: 'Error fetching transactions',
        };
    }
};