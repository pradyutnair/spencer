import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { Transaction } from '@/types/index';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { transactions, loading, fetchTransactions } = useTransactionStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      fetchTransactions().then(r => r);
      setInitialized(true);
    }
  }, [fetchTransactions, initialized]);

  return (
    <TransactionContext.Provider value={{ transactions, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
};