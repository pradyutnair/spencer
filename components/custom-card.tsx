'use client';
import React, { useEffect } from 'react';

import { Icon } from 'lucide-react';
import {
  Card,
  CardContent, CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { Transaction } from '@/types/index';
import { fetchExpenditure, fetchIncome } from '@/lib/analytics.actions';
import {
  EuroIcon,
  SquarePlus,
  Coins
} from 'lucide-react';
import { SkeletonCard } from '@/components/skeletons/card-skeleton';


export default function CustomCard(firstname:string ): JSX.Element {
  const { transactions, loading, setTransactions, setLoading } = useTransactionStore();
  const {dateRange} = useDateRangeStore();

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
  }, [setLoading, setTransactions]);

  console.log("Fetching transaction data from store", typeof transactions, transactions);
  console.log("Fetching date range from store", dateRange);

  // Fetch the current expenditure and percentage difference
  const {currentExpenditure, percentageDifference} = fetchExpenditure(transactions, dateRange);

  // Fetch the current income and percentage difference
  const {currentIncome, incomePercentageDifference} = fetchIncome(transactions, dateRange);

  // Calculate net income
  let netIncome = currentIncome - -currentExpenditure;
  // Round to 2 decimal places
  netIncome = Number(netIncome.toFixed(2));
  // Convert to string and add a + sign if positive or a - sign if negative
  const netIncomeString = (netIncome > 0 ? '+' : '') + netIncome;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }
  return (
    <div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/*EXPENSES CARD*/}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {'Expenditure'}
          </CardTitle>
          <EuroIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentExpenditure}</div>
          <p className="text-xs text-muted-foreground">
            {percentageDifference}% from previous period
          </p>
        </CardContent>
      </Card>

      {/*INCOME CARD*/}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {'Income'}
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{currentIncome}</div>
          <p className="text-xs text-muted-foreground">
            {incomePercentageDifference}% from previous period
          </p>
        </CardContent>
      </Card>

      {/*INCOME CARD*/}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {'Net Income'}
          </CardTitle>
          <SquarePlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{netIncomeString}</div>
          <p className="text-xs text-muted-foreground">
          </p>
        </CardContent>
      </Card>

      {/*INCOME CARD*/}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {'title'}
          </CardTitle>
          <SquarePlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentIncome}</div>
          <p className="text-xs text-muted-foreground">
            {incomePercentageDifference}% from previous period
          </p>
        </CardContent>
      </Card>
    </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/*<Overview />*/}
          </CardContent>
        </Card>
        <Card className="col-span-4 md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made 265 sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/*<RecentSales />*/}
          </CardContent>
        </Card>
      </div>
    </div>

)
  ;
};