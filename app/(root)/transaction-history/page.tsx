import React from 'react';
import { TransactionsTable } from '@/components/TransactionsTable';

const TransactionsPage = () => {
    return (
        <div className="w-full p-4 overflow-hidden">
            <h1 className="text-2xl font-bold mb-4 font-inter w-full pt-8 px-4">Your Transactions</h1>
            <TransactionsTable />
        </div>
    );
};

export default TransactionsPage;
