import { NextRequest, NextResponse } from 'next/server';
import { getGCTransactions, getRequisitions } from '@/lib/bank.actions';
import { pullTransactionsDB } from '@/lib/db.actions';

export const GET = async (req: NextRequest) => {
    try {
        // Parse the request body safely
        // const body = await req.json().catch(() => ({}));
        // const { tabularDataCheck = false } = body;

        // Get the requisition details including requisitionId
        const requisitionData = await getRequisitions();

        // Initialize an empty array to hold all transactions
        let allTransactions: any[] = [];

        // Fetch transactions for each requisition
        for (const { requisitionId, bankName } of requisitionData) {
            // Console log the requisitionId
            console.log('Requisition ID:', requisitionId);

            // Get all transactions for a requisition
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
        return NextResponse.json(
          { error: 'Error fetching transactions' },
          { status: 500 }
        );
    }
};
