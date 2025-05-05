// stores/bank-balances-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BankData } from '@/types/index';

interface BankState {
  bankData: BankData[];
  bankDataLoading: boolean;
  lastFetched: number;
  setBankData: (bankData: BankData[]) => void;
  setBankDataLoading: (loading: boolean) => void;
  fetchBankData: () => Promise<void>;
}

// Increased cache duration to 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// Function to load initial data from localStorage
const loadInitialData = () => {
  try {
    const storedData = localStorage.getItem('bank-balances-storage');
    if (!storedData) return { bankData: [], lastFetched: 0 };
    
    const parsedData = JSON.parse(storedData);
    if (!parsedData.state) return { bankData: [], lastFetched: 0 };
    
    return {
      bankData: parsedData.state.bankData || [],
      lastFetched: parsedData.state.lastFetched || 0
    };
  } catch (error) {
    console.error('Error loading initial bank data:', error);
    return { bankData: [], lastFetched: 0 };
  }
};

// Get initial data before creating store
const initialData = typeof window !== 'undefined' ? loadInitialData() : { bankData: [], lastFetched: 0 };

export const useBankStore = create<BankState>()(
  persist(
    (set, get) => ({
      bankData: initialData.bankData,
      bankDataLoading: initialData.bankData.length === 0,
      lastFetched: initialData.lastFetched,
      setBankData: (bankData) => set({ bankData, bankDataLoading: false, lastFetched: Date.now() }),
      setBankDataLoading: (loading) => set({ bankDataLoading: loading }),
      fetchBankData: async () => {
        const { lastFetched, bankData } = get();
        
        // Return immediately if cache is fresh
        if (Date.now() - lastFetched < CACHE_DURATION && bankData.length > 0) {
          console.log('Using cached bank data', bankData.length);
          set({ bankDataLoading: false });
          return;
        }

        set({ bankDataLoading: true });
        try {
          const response = await fetch('/api/getBalances', {
            cache: 'no-store' // Prevent browser caching - we'll handle that ourselves
          });
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const data: BankData[] = await response.json();
          set({ bankData: data, lastFetched: Date.now(), bankDataLoading: false });
          
          // Cache in localStorage directly as well for redundancy
          try {
            localStorage.setItem('bankData', JSON.stringify(data));
            localStorage.setItem('bankData_timestamp', Date.now().toString());
          } catch (storageError) {
            console.error('Failed to save bank data to localStorage:', storageError);
          }
          
          console.log('Fetched fresh bank data', data.length);
        } catch (error) {
          console.error('Error fetching balances:', error);
          // If we have stale data, use it as fallback
          if (bankData.length > 0) {
            set({ bankDataLoading: false });
          } else {
            // Try to load from localStorage as emergency backup
            try {
              const cachedData = localStorage.getItem('bankData');
              if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                set({ bankData: parsedData, bankDataLoading: false });
                console.log('Used emergency localStorage fallback for bank data');
              }
            } catch (fallbackError) {
              console.error('Failed to load fallback bank data:', fallbackError);
            }
          }
        }
      },
    }),
    {
      name: 'bank-balances-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return {
            getItem: async (name) => {
              try {
                const storedItem = localStorage.getItem(name);
                return storedItem ? JSON.parse(storedItem) : null;
              } catch (error) {
                console.error('Error retrieving bank data from storage:', error);
                return null;
              }
            },
            setItem: async (name, value) => {
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch (error) {
                console.error('Error storing bank data:', error);
              }
            },
            removeItem: async (name) => {
              try {
                localStorage.removeItem(name);
              } catch (error) {
                console.error('Error removing bank data from storage:', error);
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
        bankData: state.bankData,
        lastFetched: state.lastFetched 
      }),
    }
  )
);