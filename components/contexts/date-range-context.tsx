'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { DateRange } from 'react-day-picker';


export const DateRangeContext = createContext<{
  dateRange: DateRange | undefined;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
}>({
  dateRange: undefined,
  setDateRange: () => {},
});

export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};
