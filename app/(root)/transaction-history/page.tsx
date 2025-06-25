import React from 'react';
import { TransactionsTableWrapper } from '@/components/TransactionsTableWrapper';

const TransactionsPage = () => {
  return (
    <div className="h-full max-h-full w-full p-4">
      <h1 className="font-inter mb-4 w-full px-4 pt-8 text-2xl font-bold">
        Your Transactions
      </h1>
      <TransactionsTableWrapper />
    </div>
  );
};

export default TransactionsPage;
