import { create } from 'zustand';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

type State = {
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
};

export const useDateRangeStore = create<State>((set) => ({
  dateRange: {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  },
  setDateRange: (dateRange) => set({ dateRange }),
}));