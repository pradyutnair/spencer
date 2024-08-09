'use client';
import React, { useEffect } from 'react';
import LinkBankAccountButton from '@/components/buttons/link-bank-account';
import SelectCurrency from '@/components/buttons/select-currency';
import { useCurrencyStore } from '@/components/stores/currency-store';
import { useBankStore } from '@/components/stores/bank-balances-store';
import { createAccountBalanceBreakdown } from '@/lib/utils';
import DoughnutChart from '@/components/balance-pie-chart';
import { TransactionProvider, useTransactionContext } from '@/hooks/transaction-context';
import BudgetComponent from '@/components/budget-progress';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CACHE_KEY = 'bankData';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

const MyBanks = () => {
  const { currency } = useCurrencyStore();
  const { bankData, setBankData, setBankDataLoading, bankDataLoading } = useBankStore();
  const { transactions } = useTransactionStore();

  useEffect(() => {
    const fetchBalances = async () => {
      setBankDataLoading(true);
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(`${CACHE_KEY}_timestamp`);

        if (cachedData && cachedTimestamp) {
          const parsedData = JSON.parse(cachedData);
          const timestamp = parseInt(cachedTimestamp, 10);

          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setBankData(parsedData);
            setBankDataLoading(false);
            return;
          }
        }

        const response = await fetch("/api/getBalances");
        const data = await response.json();
        setBankData(data);

        // Cache the new data
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setBankDataLoading(false);
      }
    };

    fetchBalances();
  }, [setBankData, setBankDataLoading]);

  const accountBalances = createAccountBalanceBreakdown(bankData, currency);

  if (bankDataLoading) {
    return <div>Loading...</div>; // Replace with a suitable loading component
  }

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
                  <DoughnutChart accountBalances={accountBalances} currency={currency} />
                </div>
                <div className="mt-4 flex justify-center h-full">
                  <SelectCurrency />
                </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center mt-8 md:mt-0 h-full">
              <BudgetComponent transactions={transactions} useColorScheme={true} />
            </div>
          </div>
        </div>
      </section>
    </TransactionProvider>
  );
};

export default MyBanks;