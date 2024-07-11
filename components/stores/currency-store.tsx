import create from 'zustand';

type CurrencyStore = {
  currency: string;
  setCurrency: (currency: string) => void;
};

export const useCurrencyStore = create<CurrencyStore>((set) => ({
  currency: 'EUR', // default currency
  setCurrency: (currency) => set({ currency }),
}));