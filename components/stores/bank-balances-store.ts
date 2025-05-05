// FILE: components/stores/bank-balances-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BankData } from '@/types/index';

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

interface BankState {
  bankData: BankData[];
  bankDataLoading: boolean;
  lastFetched: number;
  error: string | null;
  setBankData: (bankData: BankData[]) => void;
  setBankDataLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchBankData: (forceRefresh?: boolean) => Promise<void>;
}

// Function to load initial state safely
const loadInitialState = (): Omit<BankState, 'setBankData' | 'setBankDataLoading' | 'setError' | 'fetchBankData'> => {
  try {
    if (typeof window === 'undefined') {
      return { bankData: [], bankDataLoading: true, lastFetched: 0, error: null };
    }
    const storedData = localStorage.getItem('bank-balances-storage');
    if (!storedData) return { bankData: [], bankDataLoading: true, lastFetched: 0, error: null };

    const parsedData = JSON.parse(storedData);
    const state = parsedData?.state;
    const bankData = state?.bankData || [];
    const lastFetched = state?.lastFetched || 0;
    const isCacheExpired = Date.now() - lastFetched > CACHE_DURATION;

    return {
      bankData: bankData,
      // Start loading if cache is expired or no data exists
      bankDataLoading: bankData.length === 0 || isCacheExpired,
      lastFetched: lastFetched,
      error: null,
    };
  } catch (error) {
    console.error('Error loading initial bank data from storage:', error);
    return { bankData: [], bankDataLoading: true, lastFetched: 0, error: null };
  }
};

const initialState = loadInitialState();

export const useBankStore = create<BankState>()(
  persist(
    (set, get) => ({
      bankData: initialState.bankData,
      bankDataLoading: initialState.bankDataLoading,
      lastFetched: initialState.lastFetched,
      error: initialState.error,

      setBankData: (bankData) => set({ bankData, bankDataLoading: false, error: null, lastFetched: Date.now() }),
      setBankDataLoading: (loading) => set({ bankDataLoading: loading }),
      setError: (error) => set({ error, bankDataLoading: false }),

      fetchBankData: async (forceRefresh = false) => {
        const { lastFetched, bankData } = get();
        const now = Date.now();
        const isCacheValid = now - lastFetched < CACHE_DURATION && bankData.length > 0;

        if (isCacheValid && !forceRefresh) {
          console.log('Using valid cached bank data.');
          set({ bankDataLoading: false, error: null }); // Ensure loading is false
          return;
        }

        console.log(forceRefresh ? 'Forcing refresh of bank data.' : 'Fetching fresh bank data (cache expired or empty).');
        set({ bankDataLoading: true, error: null });

        try {
          // Pass forceRefresh to the API if needed, or handle logic here
          const apiUrl = forceRefresh ? '/api/getBalances?refresh=true' : '/api/getBalances';
          const response = await fetch(apiUrl, { cache: 'no-store' });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch balances' }));
            throw new Error(errorData.error || `API Error: ${response.status}`);
          }

          const data: BankData[] = await response.json();

          // Update local storage cache manually as a fallback
          try {
             localStorage.setItem('bankData', JSON.stringify(data));
             localStorage.setItem('bankData_timestamp', now.toString());
          } catch (storageError) {
             console.warn('Could not update localStorage cache for bank data:', storageError);
          }

          set({ bankData: data, lastFetched: now, bankDataLoading: false, error: null });
          console.log('Successfully fetched/updated bank data.');

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching balances';
          console.error('Error fetching balances:', error);
          // Keep existing data if fetch fails but don't update lastFetched time
          set({ error: errorMessage, bankDataLoading: false });

          // Attempt to load emergency backup from direct localStorage if store is empty
          if (get().bankData.length === 0) {
            try {
              const lsData = localStorage.getItem('bankData');
              const lsTimestamp = localStorage.getItem('bankData_timestamp');
              if (lsData && lsTimestamp) {
                 const parsedLsData = JSON.parse(lsData);
                 set({ bankData: parsedLsData, lastFetched: parseInt(lsTimestamp, 10), bankDataLoading: false, error: `Error fetching fresh data. Displaying cached data from ${new Date(parseInt(lsTimestamp, 10)).toLocaleString()}.` });
                 console.log('Used emergency localStorage fallback for bank data.');
              }
            } catch (fallbackError) {
              console.error('Failed to load localStorage fallback:', fallbackError);
            }
          }
        }
      },
    }),
    {
      name: 'bank-balances-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({
        bankData: state.bankData,
        lastFetched: state.lastFetched,
        // Don't persist loading or error states
      }),
      // Optional: Migrate state structure if it changes
      // migrate: (persistedState, version) => { ... }
    }
  )
);