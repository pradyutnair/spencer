import { create } from 'zustand';
import { useFetchExpenditure as fetchExpenditureData } from '@/lib/analytics.actions';
import { useTransactionStore } from '@/components/stores/transaction-store';

type State = {
  currentExpenditure: number;
  percentageDifference: number;
  fetchExpenditure: () => void;
};

export const useCustomCardStore = create<State>((set) => ({
  currentExpenditure: 0,
  percentageDifference: 0,
  fetchExpenditure: () => {
    const { amount, percentage } = fetchExpenditureData();
    set({ currentExpenditure: amount, percentageDifference: percentage });
  },
}));