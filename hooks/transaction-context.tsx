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
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Don't run on server
    
    // Ensure data is loaded when provider mounts
    const isDataLoaded = ensureTransactionDataLoaded();
    
    console.log(`TransactionProvider: Data loaded status: ${isDataLoaded}, Loading: ${loading}, Transactions: ${transactions.length}`);
    
    // If no data is loaded and we're not loading, trigger fetch
    if (!isDataLoaded && !loading) {
      console.log("TransactionProvider: Triggering data fetch for dashboard");
      fetchTransactions();
    }
  }, [isClient, fetchTransactions, loading, transactions.length]);

  // Also trigger a check periodically to ensure data freshness
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      const isDataLoaded = ensureTransactionDataLoaded();
      if (!isDataLoaded && !loading) {
        console.log("TransactionProvider: Periodic check - triggering data fetch");
        fetchTransactions();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isClient, fetchTransactions, loading]);

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