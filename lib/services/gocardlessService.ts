import { getRequisitions, getGCTransactions } from '@/lib/bank.actions';
import { pullTransactionsDB, pushTransactionsDB } from '@/lib/db.actions';

/**
 * Fetches transactions from GoCardless for each requisition and upserts into DB
 */
export async function fetchAndStore() {
  const requisitions = await getRequisitions();
  for (const { requisitionId } of requisitions) {
    const transactions = await getGCTransactions({ requisitionIds: [requisitionId] });
    for (const tx of transactions) {
      await pushTransactionsDB(tx, requisitionId);
    }
  }
}

/**
 * Returns cached transactions from the DB for a given requisition
 */
export async function getCachedTransactions(requisitionId: string) {
  return await pullTransactionsDB(requisitionId);
}
