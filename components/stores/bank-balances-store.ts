import { create } from 'zustand';
import { BankData } from '@/types';

type BankStore = {
  bankData: BankData[];
  bankDataLoading: boolean;
  setBankData: (data: BankData[]) => void;
  setBankDataLoading: (loading: boolean) => void;
};

export const useBankStore = create<BankStore>((set) => ({
  bankData: [],
  bankDataLoading: true,
  setBankData: (data) => set({ bankData: data }),
  setBankDataLoading: (loading) => set({ bankDataLoading: loading}),
}));

