import React from 'react';
import { TransactionsTable } from '@/components/TransactionsTable';

const TransactionsPage = () => {
  return (
    <div className="h-full max-h-full w-full p-4">
      <h1 className="font-inter mb-4 w-full px-4 pt-8 text-2xl font-bold">
        Your Transactions
      </h1>
      <TransactionsTable />
    </div>
  );
};

export default TransactionsPage;
