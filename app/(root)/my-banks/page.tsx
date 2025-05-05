// FILE: app/(root)/my-banks/page.tsx
'use client';
import React, { useEffect, useMemo } from 'react';
import LinkBankAccountButton from '@/components/buttons/link-bank-account';
import SelectCurrency from '@/components/buttons/select-currency';
import { useCurrencyStore } from '@/components/stores/currency-store';
import { useBankStore } from '@/components/stores/bank-balances-store';
import { createAccountBalanceBreakdown } from '@/lib/utils'; // Ensure this function is efficient
import DoughnutChart from '@/components/balance-pie-chart';
import BudgetComponent from '@/components/budget-progress';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area'; // Use ScrollArea

const MyBanks = () => {
  const { currency } = useCurrencyStore();
  const { bankData, bankDataLoading, fetchBankData, error: bankError } = useBankStore();
  const { transactions, loading: transactionsLoading, fetchTransactions, error: transactionError } = useTransactionStore();

  // Fetch data on mount
  useEffect(() => {
    // Fetch both simultaneously
    fetchBankData();
    fetchTransactions();
  }, [fetchBankData, fetchTransactions]); // Dependencies are stable functions from store

  // Memoize derived data to prevent recalculations on every render
  const accountBalances = useMemo(() => {
    // Ensure createAccountBalanceBreakdown handles potential empty bankData
    return createAccountBalanceBreakdown(bankData || [], currency);
  }, [bankData, currency]);

  const isLoading = bankDataLoading || transactionsLoading;
  const hasError = bankError || transactionError;

  // Loading State
  if (isLoading) {
    return (
      <section className="flex h-full">
        <div className="my-banks w-full p-4 md:p-8 overflow-hidden mt-7">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-32" /> {/* Title Skeleton */}
            <Skeleton className="h-10 w-48" /> {/* Button Skeleton */}
          </div>
          <div className="flex flex-col md:flex-row items-start mt-14 gap-8">
             {/* Chart Area Skeleton */}
            <div className="w-full md:w-1/2 flex flex-col items-center gap-4">
              <Skeleton className="w-64 h-64 md:w-80 md:h-80 rounded-full" /> {/* Doughnut Skeleton */}
              <Skeleton className="h-10 w-40" /> {/* Currency Selector Skeleton */}
            </div>
             {/* Budget Area Skeleton */}
            <div className="w-full md:w-1/2">
               <Skeleton className="h-12 w-full mb-4" />
               <Skeleton className="h-40 w-full mb-4" />
               <Skeleton className="h-40 w-full mb-4" />
               <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error State
  if (hasError) {
      return <div className="p-8 text-red-500">Error loading bank data: {bankError || transactionError}</div>;
  }

  // Content
  return (
      <section className="flex h-full">
        <ScrollArea className="w-full h-full"> {/* Wrap content in ScrollArea */}
           <div className="my-banks w-full p-4 md:p-8 mt-7">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4"> {/* Flex wrap for smaller screens */}
                  <h1 className="text-2xl font-bold font-inter">
                  Your Banks & Budgets
                  </h1>
                  <LinkBankAccountButton />
              </div>

              <div className="flex flex-col lg:flex-row items-start mt-10 gap-8"> {/* Use lg for breakpoint */}
                 {/* Left Side: Doughnut Chart and Currency */}
                  <div className="w-full lg:w-1/3 flex flex-col items-center gap-6"> {/* Adjusted width */}
                      <div className="flex justify-center w-full max-w-xs md:max-w-sm"> {/* Constrain chart size */}
                         {/* Ensure DoughnutChart handles empty data */}
                         <DoughnutChart accountBalances={accountBalances || []} currency={currency} />
                      </div>
                      <div className="flex justify-center">
                         <SelectCurrency />
                      </div>
                  </div>

                 {/* Right Side: Budget Component */}
                  <div className="w-full lg:w-2/3"> {/* Adjusted width */}
                      <BudgetComponent transactions={transactions} useColorScheme={true} />
                  </div>
              </div>
           </div>
        </ScrollArea>
      </section>
  );
};

export default MyBanks;