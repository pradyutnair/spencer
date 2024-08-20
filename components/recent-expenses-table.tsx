import { Transaction } from '@/types/index';
import { formatAmount } from '@/lib/utils';
import React from 'react';
import { useCurrencyStore } from '@/components/stores/currency-store';

interface RecentSalesProps {
  transactions: Transaction[];
}

function generateAvatarInitials(name: string): string {
  const initials = name.split(' ').map((n) => n[0]).join('');
  return initials.slice(0, 2).toUpperCase();
}

export function RecentExpensesTable({ transactions }: RecentSalesProps) {
  // Get currency
  let {currency} = useCurrencyStore();

  // Filter transactions to only include those that have currency
  let recentTransactions = transactions.filter((transaction: { currency: string; }) =>
    transaction.currency === currency);

  // Take the 5 most recent ones
  recentTransactions = recentTransactions.slice(0, 7);

  return (
    <div className="space-y-4">
      {recentTransactions.map((transaction, index) => (
        <div className="flex items-center" key={index}>
          {/*<Avatar className="h-9 w-9">*/}
          {/*  <AvatarFallback>{generateAvatarInitials(transaction.Payee)}</AvatarFallback>*/}
          {/*</Avatar>*/}
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.Payee}</p>
          </div>
          <div className={`ml-auto font-medium ${transaction.amount < 0 ? 'text-[#f04438]' : 'text-[#039855]'}`}>
            {formatAmount(transaction.amount, transaction.currency)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Example usage
// import transactions data and pass it to the RecentExpensesTable component
// <RecentExpensesTable transactions={transactions} />
