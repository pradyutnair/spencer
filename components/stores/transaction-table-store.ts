import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction } from '@/types/index';

interface TransactionTableState {
  transactions: Transaction[];
  loading: boolean;
  lastFetched: number;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  fetchTransactions: () => Promise<void>;
}

// Increase cache duration to reduce API calls
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Function to load initial data from localStorage
const loadInitialData = () => {
  try {
    const storedData = localStorage.getItem('transactions-table-storage');
    if (!storedData) return { transactions: [], lastFetched: 0 };
    
    const parsedData = JSON.parse(storedData);
    if (!parsedData.state) return { transactions: [], lastFetched: 0 };
    
    return {
      transactions: parsedData.state.transactions || [],
      lastFetched: parsedData.state.lastFetched || 0
    };
  } catch (error) {
    console.error('Error loading initial transaction table data:', error);
    return { transactions: [], lastFetched: 0 };
  }
};

// Safe initial state for SSR compatibility
const initialData = { transactions: [], lastFetched: 0 };

export const useTransactionTableStore = create<TransactionTableState>()(
  persist(
    (set, get) => ({
      transactions: initialData.transactions,
      loading: initialData.transactions.length === 0,
      lastFetched: initialData.lastFetched,
      setTransactions: (transactions) => set({ transactions }),
      setLoading: (loading) => set({ loading }),
      fetchTransactions: async () => {
        const { lastFetched, transactions } = get();
        
        // Use cached data if it's fresh enough
        if (Date.now() - lastFetched < CACHE_DURATION && transactions.length > 0) {
          set({ loading: false });
          console.log("Using cached data for transactions table");
          return;
        }

        set({ loading: true });
        try {
          // First check if we can get data from main transaction store
          if (typeof window !== 'undefined') {
            try {
              const mainStorageData = localStorage.getItem('transactions-storage');
              if (mainStorageData) {
                const parsedData = JSON.parse(mainStorageData);
                if (parsedData?.state?.transactions?.length > 0 && 
                    Date.now() - (parsedData?.state?.lastFetched || 0) < CACHE_DURATION) {
                  set({
                    transactions: parsedData.state.transactions,
                    lastFetched: parsedData.state.lastFetched,
                    loading: false
                  });
                  console.log("Reusing data from main transaction store");
                  return;
                }
              }
            } catch (storageError) {
              console.error("Error accessing main transaction store:", storageError);
            }
          }

          // Fetch fresh data if needed
          const response = await fetch("/api/transactionsTable", {
            cache: 'no-store' // Prevent browser caching
          });
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const data: Transaction[] = await response.json();
          
          // Sort by date
          const sortedData = data.sort((a: Transaction, b: Transaction) => {
            const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : 
                        (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
            const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : 
                        (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
            return dateB - dateA;
          });
          
          set({ transactions: sortedData, lastFetched: Date.now(), loading: false });
        } catch (error) {
          console.error("Error fetching transactions:", error);
          set({ loading: false });
          
          // Try to use cached data as fallback
          if (transactions.length > 0) {
            console.log("Using stale cached data as fallback");
          }
        }
      },
    }),
    {
      name: 'transactions-table-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        lastFetched: state.lastFetched,
      }),
    }
  )
);