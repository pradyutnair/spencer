import { create } from 'zustand';
import { Transaction } from '@/types/index';

interface TransactionTableState {
  transactions: Transaction[];
  loading: boolean;
  lastFetched: number;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  fetchTransactions: () => Promise<void>;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useTransactionTableStore = create<TransactionTableState>((set, get) => ({
  transactions: [],
  loading: true,
  lastFetched: 0,
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (loading) => set({ loading }),
  fetchTransactions: async () => {
    const { lastFetched, transactions } = get();
    if (Date.now() - lastFetched < CACHE_DURATION && transactions.length > 0) {
      set({ loading: false });
      console.log("Using cached data for transactions table");
      return;
    }

    set({ loading: true });
    try {
      const response = await fetch("/api/transactionsTable");
      const data: Transaction[] = await response.json();
      const sortedData = data.sort((a: Transaction, b: Transaction) => {
        const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : -Infinity;
        const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : -Infinity;
        return dateB - dateA;
      });
      set({ transactions: sortedData, lastFetched: Date.now(), loading: false });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      set({ loading: false });
    }
  },
}));