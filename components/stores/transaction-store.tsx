// FILE: components/stores/transaction-store.tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction } from '@/types/index';

// Cache duration: 30 minutes (more frequent than balances potentially)
const CACHE_DURATION = 30 * 60 * 1000;

interface TransactionState {
  transactions: Transaction[];
  transactionsByBank: Record<string, Transaction[]>;
  loading: boolean;
  lastFetched: number;
  error: string | null;
  setTransactions: (transactions: Transaction[], bankTransactions?: Record<string, Transaction[]>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTransactions: (forceRefresh?: boolean) => Promise<void>;
  refreshTransactions: () => Promise<void>; // Keep explicit refresh if needed elsewhere
}

// Function to load initial state safely and trigger an immediate fetch if needed
const loadInitialState = (): Omit<TransactionState, 'setTransactions' | 'setLoading' | 'setError' | 'fetchTransactions' | 'refreshTransactions'> => {
  try {
    if (typeof window === 'undefined') {
      return { transactions: [], transactionsByBank: {}, loading: true, lastFetched: 0, error: null };
    }
    const storedData = localStorage.getItem('transactions-storage');
    if (!storedData) return { transactions: [], transactionsByBank: {}, loading: true, lastFetched: 0, error: null };

    const parsedData = JSON.parse(storedData);
    const state = parsedData?.state;
    const transactions = state?.transactions || [];
    const transactionsByBank = state?.transactionsByBank || {};
    const lastFetched = state?.lastFetched || 0;
    const isCacheExpired = Date.now() - lastFetched > CACHE_DURATION;

    // If we have an empty cache or expired cache, this will trigger a fetch on creation
    return {
      transactions: transactions,
      transactionsByBank: transactionsByBank,
      loading: transactions.length === 0 || isCacheExpired,
      lastFetched: lastFetched,
      error: null,
    };
  } catch (error) {
    console.error('Error loading initial transaction data from storage:', error);
    return { transactions: [], transactionsByBank: {}, loading: true, lastFetched: 0, error: null };
  }
};

const initialState = loadInitialState();

// Helper to group transactions by bank
const groupTransactionsByBank = (transactions: Transaction[]): Record<string, Transaction[]> => {
  return transactions.reduce((acc, transaction) => {
    // Use a default 'unknown_bank' if Bank property is missing
    const bankId = transaction.Bank || 'unknown_bank';
    acc[bankId] = acc[bankId] || [];

    // Simple duplicate check based on transactionId within the same bank group being built
    const isDuplicate = acc[bankId].some(t => t.transactionId === transaction.transactionId);
    if (!isDuplicate) {
      acc[bankId].push(transaction);
    }
    return acc;
  }, {} as Record<string, Transaction[]>);
};

// Helper to sort transactions
const sortTransactions = (transactions: Transaction[]): Transaction[] => {
   return transactions.sort((a, b) => {
      const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() :
                  (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
      const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() :
                  (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
      // Handle potential NaN results from invalid dates
      const timeA = isNaN(dateA) ? -Infinity : dateA;
      const timeB = isNaN(dateB) ? -Infinity : dateB;
      return timeB - timeA; // Descending order
    });
};


export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: initialState.transactions,
      transactionsByBank: initialState.transactionsByBank,
      loading: initialState.loading,
      lastFetched: initialState.lastFetched,
      error: initialState.error,

      setTransactions: (transactions, bankTransactions) => {
        const sortedTxs = sortTransactions(transactions);
        const groupedTxs = bankTransactions || groupTransactionsByBank(sortedTxs);
        set({
          transactions: sortedTxs,
          transactionsByBank: groupedTxs,
          loading: false,
          error: null,
          lastFetched: Date.now(),
        });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error, loading: false }),

      fetchTransactions: async (forceRefresh = false) => {
        const { lastFetched, transactions } = get();
        const now = Date.now();
        const isCacheValid = now - lastFetched < CACHE_DURATION && transactions.length > 0;

        if (isCacheValid && !forceRefresh) {
          console.log('Using valid cached transaction data.');
          set({ loading: false, error: null }); // Ensure loading is false
          return;
        }

        console.log(forceRefresh ? 'Forcing refresh of transaction data.' : 'Fetching fresh transaction data (cache expired or empty).');
        set({ loading: true, error: null });

        try {
          // Fetch grouped data directly
          const apiUrl = forceRefresh ? '/api/transactions?refresh=true&bankGrouping=true' : '/api/transactions?bankGrouping=true';
          const response = await fetch(apiUrl, { 
            cache: 'no-store',
            // Add signal for abort controller in case we need to cancel
            signal: AbortSignal.timeout(15000) // 15 seconds timeout
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }));
            throw new Error(errorData.error || `API Error: ${response.status}`);
          }

          const data = await response.json();

          if (data.bankTransactions) {
            let allTransactions: Transaction[] = [];
            const fetchedBankTransactions: Record<string, Transaction[]> = {};

            Object.entries(data.bankTransactions).forEach(([bankId, txs]: [string, any]) => {
               const bankTxsList = txs as Transaction[];
               fetchedBankTransactions[bankId] = bankTxsList;
               allTransactions.push(...bankTxsList);
            });

            get().setTransactions(allTransactions, fetchedBankTransactions); // Use the setter
            console.log('Successfully fetched/updated grouped transaction data.');

          } else {
             // Handle case where API might return flat list (fallback)
             console.warn("API did not return grouped transactions, processing flat list.");
             get().setTransactions(data); // Use the setter
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching transactions';
          console.error('Error fetching transactions:', error);
          set({ error: errorMessage, loading: false });
          // Keep existing data if fetch fails
        }
      },

      // Kept refreshTransactions in case it's used for explicit user actions
      refreshTransactions: async () => {
        console.log('Explicitly refreshing transactions...');
        await get().fetchTransactions(true);
      },
    }),
    {
      name: 'transactions-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({
        transactions: state.transactions,
        transactionsByBank: state.transactionsByBank,
        lastFetched: state.lastFetched,
        // Don't persist loading or error states
      }),
      // This is critical - make store fetch data immediately after hydration
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;
          
          // Check if we need to fetch data immediately
          const now = Date.now();
          const needsFetch = !state.transactions || 
                            state.transactions.length === 0 || 
                            now - state.lastFetched > CACHE_DURATION;
          
          if (needsFetch) {
            console.log('Fetching transaction data immediately after store hydration');
            // Wait a small delay to ensure store is fully ready
            setTimeout(() => {
              useTransactionStore.getState().fetchTransactions();
            }, 100);
          }
        };
      }
    }
  )
);

// We should also check the TransactionProvider context to ensure it doesn't get stuck in loading
export const ensureTransactionDataLoaded = (): boolean => {
  const { transactions, loading, fetchTransactions, lastFetched } = useTransactionStore.getState();
  const now = Date.now();
  const needsFetch = !transactions || 
                     transactions.length === 0 || 
                     now - lastFetched > CACHE_DURATION;
  
  if (needsFetch && !loading) {
    fetchTransactions();
    return false;
  }
  
  return !needsFetch || transactions.length > 0;
};