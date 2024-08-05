'use client';
import React, { useEffect } from 'react';
import BankCard from '@/components/BankCard';
import { useBankStore } from '@/components/stores/bank-balances-store';
import { BankData, Transaction } from '@/types/index';
import BankCardSkeleton from '@/components/skeletons/BankCardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DoughnutChartCard from '@/components/balance-pie-chart';
import { createAccountBalanceBreakdown } from '@/lib/bank.actions';

const AsyncMyBanks = () => {
  const { bankData, bankDataLoading, setBankData, setBankDataLoading } = useBankStore();
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await fetch("/api/getBalances");
        const data: BankData[] = await response.json();
        setBankData(data);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setBankDataLoading(false);
      }
    };
    fetchBalances();
  }, [setBankData, setBankDataLoading]);

  if (bankDataLoading) {
    return <SkeletonFallback />;
  }

  return (
    <div className="flex">
      <div className="w-full">
        <div className="flex">
          {bankData && bankData.map(({ requisitionId, bankName, bankLogo, balances, reqCreated }) => (
            <BankCard
              key={requisitionId}
              requisitionId={requisitionId}
              balances={Object.values(balances)}
              bankName={bankName}
              bankLogo={bankLogo}
              reqCreated={reqCreated}
            />
          ))}
        </div>
      </div>
    </div>
  );
};


// Component to render while loading
const SkeletonFallback = () => (
  <section className='flex'>
    <div className="my-banks">
      <div className="w-full p-4 overflow-hidden">
        <h1 className="text-2xl font-bold mb-4 font-inter w-full pt-8 px-4">
        </h1>
        <div className="flex flex-wrap gap-6 px-4">
          <BankCardSkeleton />
          <BankCardSkeleton />
          <BankCardSkeleton />
          <BankCardSkeleton />
        </div>
      </div>
    </div>
  </section>
);


export default AsyncMyBanks;