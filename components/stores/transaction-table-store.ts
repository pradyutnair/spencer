import { create } from 'zustand';
import { Transaction } from '@/types/index';

type State = {
  transactions: Transaction[];
  loading: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
};

export const useTransactionTableStore = create<State>((set) => ({
  transactions: [],
  loading: true,
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (loading) => set({ loading }),
}));