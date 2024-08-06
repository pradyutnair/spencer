// stores/bank-balances-store.ts
import { create } from 'zustand';
import { BankData } from '@/types/index';

interface BankState {
  bankData: BankData[];
  bankDataLoading: boolean;
  lastFetched: number;
  setBankData: (bankData: BankData[]) => void;
  setBankDataLoading: (loading: boolean) => void;
  fetchBankData: () => Promise<void>;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useBankStore = create<BankState>((set, get) => ({
  bankData: [],
  bankDataLoading: true,
  lastFetched: 0,
  setBankData: (bankData) => set({ bankData }),
  setBankDataLoading: (loading) => set({ bankDataLoading: loading }),
  fetchBankData: async () => {
    const { lastFetched } = get();
    if (Date.now() - lastFetched < CACHE_DURATION) {
      set({ bankDataLoading: false });
      return;
    }

    set({ bankDataLoading: true });
    try {
      const response = await fetch('/api/getBalances');
      const data: BankData[] = await response.json();
      set({ bankData: data, lastFetched: Date.now() });
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      set({ bankDataLoading: false });
    }
  },
}));