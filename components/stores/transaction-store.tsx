// stores/transaction-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction } from '@/types/index';

interface TransactionState {
  transactions: Transaction[];
  transactionsByBank: Record<string, Transaction[]>;
  loading: boolean;
  lastFetched: number;
  error: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  addBankTransactions: (transactions: Transaction[], bankId: string) => void;
  setLoading: (loading: boolean) => void;
  fetchTransactions: () => Promise<void>;
  getFilteredTransactions: (bankIds?: string[]) => Transaction[];
  refreshTransactions: () => Promise<void>;
}

// Increased from 30 minutes to 1 hour to reduce API calls
const CACHE_DURATION = 60 * 60 * 1000;

// Function to load initial data from local storage
const loadInitialData = () => {
  try {
    const storedData = localStorage.getItem('transactions-storage');
    if (!storedData) return { transactions: [], transactionsByBank: {}, lastFetched: 0 };
    
    const parsedData = JSON.parse(storedData);
    if (!parsedData.state) return { transactions: [], transactionsByBank: {}, lastFetched: 0 };
    
    return {
      transactions: parsedData.state.transactions || [],
      transactionsByBank: parsedData.state.transactionsByBank || {},
      lastFetched: parsedData.state.lastFetched || 0
    };
  } catch (error) {
    console.error('Error loading initial transaction data:', error);
    return { transactions: [], transactionsByBank: {}, lastFetched: 0 };
  }
};

// Get initial data before creating store
const initialData = typeof window !== 'undefined' ? loadInitialData() : { transactions: [], transactionsByBank: {}, lastFetched: 0 };

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: initialData.transactions,
      transactionsByBank: initialData.transactionsByBank,
      loading: initialData.transactions.length === 0,
      lastFetched: initialData.lastFetched,
      error: null,
      
      setTransactions: (transactions) => set({ 
        transactions,
        transactionsByBank: transactions.reduce((acc, transaction) => {
          const bankId = transaction.Bank || 'unknown';
          acc[bankId] = acc[bankId] || [];
          
          const isDuplicate = acc[bankId].some(t => 
            t.transactionId === transaction.transactionId && 
            t.bookingDate === transaction.bookingDate
          );
          
          if (!isDuplicate) {
            acc[bankId].push(transaction);
          }
          
          return acc;
        }, {} as Record<string, Transaction[]>)
      }),
      
      addBankTransactions: (transactions, bankId) => {
        const currentTransactions = [...get().transactions];
        const currentBankTransactions = { ...get().transactionsByBank };
        
        const newTransactionIds = new Set(transactions.map(t => t.transactionId));
        
        const filteredCurrentTransactions = currentTransactions.filter(
          t => !newTransactionIds.has(t.transactionId)
        );
        
        const combinedTransactions = [...filteredCurrentTransactions, ...transactions];
        
        const sortedTransactions = combinedTransactions.sort((a, b) => {
          const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : 
                      (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
          const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : 
                      (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
          return dateB - dateA;
        });
        
        currentBankTransactions[bankId] = transactions;
        
        set({ 
          transactions: sortedTransactions, 
          transactionsByBank: currentBankTransactions,
          lastFetched: Date.now()
        });
      },
      
      setLoading: (loading) => set({ loading }),
      
      getFilteredTransactions: (bankIds) => {
        const { transactions, transactionsByBank } = get();
        
        if (!bankIds || bankIds.length === 0) {
          return transactions;
        }
        
        return bankIds.flatMap(bankId => 
          transactionsByBank[bankId] || []
        );
      },

      fetchTransactions: async () => {
        const { lastFetched, transactions } = get();
        
        // Return immediately if we have cached data that's fresh enough
        if (Date.now() - lastFetched < CACHE_DURATION && transactions.length > 0) {
          console.log('Using cached transactions', transactions.length);
          return;
        }

        set({ loading: true, error: null });
        
        try {
          // First try to get data from cache quickly to show something
          const cachedResponse = await fetch('/api/transactions?source=cache', {
            cache: 'no-store' // Prevent browser caching - we'll handle that ourselves
          });
          
          if (cachedResponse.ok) {
            const cachedData: Transaction[] = await cachedResponse.json();
            if (cachedData && cachedData.length > 0) {
              set({ transactions: cachedData, loading: false });
              console.log('Loaded initial data from cache', cachedData.length);
            }
          }
          
          // Then fetch the latest data from our API with bank grouping
          const response = await fetch('/api/transactions?bankGrouping=true', {
            cache: 'no-store' // Prevent browser caching
          });
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.bankTransactions) {
            const allTransactions: Transaction[] = [];
            const bankTransactions: Record<string, Transaction[]> = {};
            
            Object.entries(data.bankTransactions).forEach(([bankId, transactions]: [string, any]) => {
              const bankTransactionsList = transactions as Transaction[];
              bankTransactions[bankId] = bankTransactionsList;
              allTransactions.push(...bankTransactionsList);
            });
            
            const sortedTransactions = allTransactions.sort((a, b) => {
              const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : 
                          (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
              const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : 
                          (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
              return dateB - dateA;
            });
            
            set({ 
              transactions: sortedTransactions, 
              transactionsByBank: bankTransactions,
              lastFetched: Date.now(), 
              loading: false 
            });
            
            console.log('Processed bank-grouped transactions', Object.keys(bankTransactions).length);
          } else {
            const sortedData = data.sort((a: Transaction, b: Transaction) => {
              const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : 
                          (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
              const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : 
                          (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
              return dateB - dateA;
            });
            
            set({ transactions: sortedData, lastFetched: Date.now(), loading: false });
            console.log('Processed flat transaction list', sortedData.length);
          }
        } catch (error) {
          console.error('Error fetching transactions:', error);
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
        }
      },
      
      refreshTransactions: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/transactions?refresh=true&bankGrouping=true', {
            cache: 'no-store' // Prevent browser caching
          });
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.bankTransactions) {
            const allTransactions: Transaction[] = [];
            const bankTransactions: Record<string, Transaction[]> = {};
            
            Object.entries(data.bankTransactions).forEach(([bankId, transactions]: [string, any]) => {
              const bankTransactionsList = transactions as Transaction[];
              bankTransactions[bankId] = bankTransactionsList;
              allTransactions.push(...bankTransactionsList);
            });
            
            const sortedTransactions = allTransactions.sort((a, b) => {
              const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : 
                          (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
              const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : 
                          (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
              return dateB - dateA;
            });
            
            set({ 
              transactions: sortedTransactions, 
              transactionsByBank: bankTransactions,
              lastFetched: Date.now(), 
              loading: false 
            });
          } else {
            const sortedData = data.sort((a: Transaction, b: Transaction) => {
              const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : 
                          (a.bookingDate ? new Date(a.bookingDate).getTime() : -Infinity);
              const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : 
                          (b.bookingDate ? new Date(b.bookingDate).getTime() : -Infinity);
              return dateB - dateA;
            });
            
            set({ transactions: sortedData, lastFetched: Date.now(), loading: false });
          }
        } catch (error) {
          console.error('Error refreshing transactions:', error);
          set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
        }
      }
    }),
    {
      name: 'transactions-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return {
            getItem: async (name) => {
              try {
                const storedItem = localStorage.getItem(name);
                return storedItem ? JSON.parse(storedItem) : null;
              } catch (error) {
                console.error('Error retrieving from storage:', error);
                return null;
              }
            },
            setItem: async (name, value) => {
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch (error) {
                console.error('Error storing data:', error);
              }
            },
            removeItem: async (name) => {
              try {
                localStorage.removeItem(name);
              } catch (error) {
                console.error('Error removing from storage:', error);
              }
            },
          };
        } else {
          return {
            getItem: async () => null,
            setItem: async () => {},
            removeItem: async () => {},
          };
        }
      }),
      partialize: (state) => ({ 
        transactions: state.transactions,
        transactionsByBank: state.transactionsByBank,
        lastFetched: state.lastFetched 
      }),
    }
  )
);