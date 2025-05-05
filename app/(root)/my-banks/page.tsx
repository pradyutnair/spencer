'use client';
import React, { useEffect } from 'react';
import LinkBankAccountButton from '@/components/buttons/link-bank-account';
import SelectCurrency from '@/components/buttons/select-currency';
import { useCurrencyStore } from '@/components/stores/currency-store';
import { useBankStore } from '@/components/stores/bank-balances-store';
import { createAccountBalanceBreakdown } from '@/lib/utils';
import DoughnutChart from '@/components/balance-pie-chart';
import { TransactionProvider } from '@/hooks/transaction-context';
import BudgetComponent from '@/components/budget-progress';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { Skeleton } from '@/components/ui/skeleton';

const MyBanks = () => {
  const { currency } = useCurrencyStore();
  const { bankData, setBankData, setBankDataLoading, bankDataLoading, fetchBankData } = useBankStore();
  const { transactions, loading: transactionsLoading, fetchTransactions } = useTransactionStore();

  // Initialize both data sources in parallel on first load
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Start loading both data sources in parallel
        const bankPromise = fetchBankData();
        const transactionPromise = fetchTransactions();
        
        // Wait for both to complete
        await Promise.allSettled([bankPromise, transactionPromise]);
        
        console.log('Initial data loading complete');
      } catch (error) {
        console.error('Error initializing dashboard data:', error);
      }
    };

    initializeData();
  }, [fetchBankData, fetchTransactions]);

  // Create account balances breakdown once bank data is loaded
  const accountBalances = React.useMemo(() => 
    createAccountBalanceBreakdown(bankData, currency),
  [bankData, currency]);

  const isLoading = bankDataLoading || transactionsLoading;

  return (
    <TransactionProvider>
      <section className="flex">
        <div className="my-banks w-full p-4 overflow-hidden mt-7 px-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-inter">
              Your Banks
            </h1>
            <LinkBankAccountButton />
          </div>
          
          <div className="flex flex-col md:flex-row items-start mt-14 space-x-0 md:space-x-8">
            <div className="w-full md:w-1/2 mt-24 flex flex-col items-center">
                <div className="flex justify-center h-full">
                  {isLoading ? (
                    <div className="w-[300px] h-[300px] flex items-center justify-center">
                      <Skeleton className="w-full h-full rounded-full" />
                    </div>
                  ) : (
                    <DoughnutChart accountBalances={accountBalances} currency={currency} />
                  )}
                </div>
                <div className="mt-4 flex justify-center h-full">
                  <SelectCurrency />
                </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center mt-8 md:mt-0 h-full max-h-[70vh] overflow-y-auto scrollbar-thin">
              {isLoading ? (
                <div className="w-full max-w-md">
                  <Skeleton className="w-full h-12 mb-4" />
                  <Skeleton className="w-full h-40 mb-4" />
                  <Skeleton className="w-full h-40 mb-4" />
                  <Skeleton className="w-full h-40" />
                </div>
              ) : (
                <BudgetComponent transactions={transactions} useColorScheme={true} />
              )}
            </div>
          </div>
        </div>
      </section>
    </TransactionProvider>
  );
};

export default MyBanks;