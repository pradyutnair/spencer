'use client';
import React, { useEffect } from 'react';
import { Coins, ExternalLink, ExternalLinkIcon, SquareArrowOutUpRight, SquarePlus, Layers3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionContext, TransactionProvider } from '@/hooks/transaction-context';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { fetchExpenditure, fetchIncome } from '@/lib/analytics.actions';
import { SkeletonCard } from '@/components/skeletons/card-skeleton';
import TransactionChart from '@/components/transaction-chart';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCurrencyStore } from '@/components/stores/currency-store';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useBankStore } from '@/components/stores/bank-balances-store';
import ChatComponent from '@/components/chat/chat-ui';
import { getCurrencySymbol } from '@/lib/currency-mapping';
import { CategoryPieChart } from '@/components/category-pie-chart';
import BudgetComponent from '@/components/budget-progress';
import Link from 'next/link';

ChartJS.register(ArcElement, Tooltip, Legend);

const CustomCard: React.FC<{ firstname: string }> = ({ firstname }) => {
  const { transactions } = useTransactionContext();
  const { bankDataLoading, fetchBankData } = useBankStore();
  const { dateRange } = useDateRangeStore();
  const { currency } = useCurrencyStore();

  const currencySymbol = getCurrencySymbol(currency);
  const [showExpenses, setShowExpenses] = React.useState(true);

  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  const { currentExpenditure, percentageDifference } = fetchExpenditure(
    transactions,
    dateRange,
    currency
  );

  const { currentIncome, incomePercentageDifference } = fetchIncome(
    transactions,
    dateRange,
    currency
  );

  // const currentWeekExpenditure = fetchCurrentWeekExpenses(
  //   transactions,
  //   currency
  // );

  let netIncome = currentIncome - -currentExpenditure;
  netIncome = Number(netIncome.toFixed(2));
  const netIncomeString = (netIncome > 0 ? '+' : '') + netIncome;
  const percentageDifferenceString =
    (percentageDifference > 0 ? '+' : '') + percentageDifference;
  const incomePercentageDifferenceString =
    (incomePercentageDifference > 0 ? '+' : '') + incomePercentageDifference;

  if (bankDataLoading) {
    return (
      <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="mt-6 grid h-full grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <SkeletonCard />
          </div>
          <div className="col-span-4 md:col-span-3">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={"font-inter"}>
      <div className="grid grid-cols-1 pb-8 pt-3 ">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex flex-row content-evenly justify-between pb-2">
              <CardDescription>
                <b className="pl-1 text-xl font-semibold text-white lg:text-4xl">
                  {currencySymbol} {showExpenses ? -1 * currentExpenditure : currentIncome}
                </b>
              </CardDescription>

              <div className="flex flex-row items-center justify-items-end space-x-2">
                <Label htmlFor="transaction-type">
                  {showExpenses ? 'Expenses' : 'Income'}
                </Label>
                <Switch
                  id="transaction-type"
                  checked={showExpenses}
                  onCheckedChange={() => setShowExpenses(!showExpenses)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pl-2">
            <TransactionChart
              transactions={transactions}
              dateRange={dateRange}
              showExpenses={showExpenses}
              setShowExpenses={setShowExpenses}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-zinc-30  from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {'Expenditure'}
            </CardTitle>
            <p className={"h-5 w-4 text-muted-foreground"} style={{ fontSize: '1.1rem', position: 'relative', top: '-4px' }}>
              {currencySymbol}
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentExpenditure}</div>
            <p className="text-xs text-muted-foreground">
              {percentageDifferenceString}% from previous period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-30  from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{'Income'}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{currentIncome}</div>
            <p className="text-xs text-muted-foreground">
              {incomePercentageDifferenceString}% from previous period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-30 from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {'Net Income'}
            </CardTitle>
            <SquarePlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netIncomeString}</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3 h-full">
        <ChatComponent />
        <Card className="col-span-1 bg-zinc-30 from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br h-full max-h-96 overflow-y-auto scrollbar-thin">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expense Breakdown</CardTitle>
              <Layers3 className="h-4 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <div className="-mt-5 mb-8 px-6">
            <CardDescription></CardDescription>
          </div>
          <CardContent>
            <div className="flex items-center justify-center">
              <CategoryPieChart transactions={transactions} currency={currency} />
            </div>
          </CardContent>
        </Card>
        <div className="col-span-1 flex h-full relative max-h-96 overflow-y-auto scrollbar-thin">
          <BudgetComponent transactions={transactions} useColorScheme={false} />
          <div className="absolute top-2 right-2 flex items-center justify-center">
            <Link href={"/my-banks"}>
              <ExternalLinkIcon className="h-4 w-5 mr-3 mt-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomCardWrapper: React.FC<{ firstname: string }> = ({ firstname }) => (
  <TransactionProvider>
    <CustomCard firstname={firstname} />
  </TransactionProvider>
);

export default CustomCardWrapper;