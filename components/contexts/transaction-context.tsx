'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction } from '@/types/index';

interface TransactionContextProps {
  transactions: Transaction[];
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextProps | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        const data: Transaction[] = await response.json();
        data.sort((a: Transaction, b: Transaction) => {
          const dateA = a.bookingDateTime ? new Date(a.bookingDateTime).getTime() : -Infinity;
          const dateB = b.bookingDateTime ? new Date(b.bookingDateTime).getTime() : -Infinity;
          return dateB - dateA;
        });
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <TransactionContext.Provider value={{ transactions, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactionContext must be used within a TransactionProvider");
  }
  return context;
};
