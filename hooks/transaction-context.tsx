import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTransactionStore, ensureTransactionDataLoaded } from '@/components/stores/transaction-store';
import { Transaction } from '@/types/index';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error?: string | null;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { transactions, loading, error, fetchTransactions } = useTransactionStore();
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);

  useEffect(() => {
    // More aggressive loading strategy - ensure we always have data
    const isDataLoaded = ensureTransactionDataLoaded();
    
    if (!isDataLoaded && !initialLoadAttempted) {
      console.log("TransactionProvider: Explicitly triggering data fetch");
      fetchTransactions();
      setInitialLoadAttempted(true);
    }
  }, [fetchTransactions, initialLoadAttempted]);

  return (
    <TransactionContext.Provider value={{ transactions, loading, error }}>
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