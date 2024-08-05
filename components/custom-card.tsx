// components/custom-card.tsx
'use client';
import React, { useEffect } from 'react';
import { Coins, SquareArrowOutUpRight, SquarePlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { BankData, Transaction } from '@/types/index';
import { fetchCurrentWeekExpenses, fetchExpenditure, fetchIncome } from '@/lib/analytics.actions';
import { SkeletonCard } from '@/components/skeletons/card-skeleton';
import TransactionChart from '@/components/transaction-chart';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RecentExpensesTable } from '@/components/recent-expenses-table';
import Link from 'next/link';
import { useCurrencyStore } from '@/components/stores/currency-store';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useBankStore } from '@/components/stores/bank-balances-store';
import DoughnutChartCard from '@/components/balance-pie-chart';
import ChatComponent from '@/components/chat/chat-ui';
import { getCurrencyIcon, getCurrencySymbol } from '@/lib/currency-mapping';
import { CategoryPieChart } from '@/components/category-pie-chart';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CustomCard(firstname: string): JSX.Element {
  const { transactions, loading, setTransactions, setLoading } =
    useTransactionStore();
  const { dateRange } = useDateRangeStore();
  const { currency, setCurrency } = useCurrencyStore();

  // Get the currency icon and symbol dynamically
  const CurrencyIcon = getCurrencyIcon(currency);
  const currencySymbol = getCurrencySymbol(currency);

  const [showExpenses, setShowExpenses] = React.useState(true);

  // Load transaction data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data: Transaction[] = await response.json();
        data.sort((a: Transaction, b: Transaction) => {
          const dateA = a.bookingDateTime
            ? new Date(a.bookingDateTime).getTime()
            : -Infinity;
          const dateB = b.bookingDateTime
            ? new Date(b.bookingDateTime).getTime()
            : -Infinity;
          return dateB - dateA;
        });
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [setLoading, setTransactions]);

  // Load bank data
  const { bankData, setBankData, setBankDataLoading } =
    useBankStore();
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await fetch('/api/getBalances');
        const data: BankData[] = await response.json();
        console.log('Bank data:', data);
        setBankData(data);
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setBankDataLoading(false);
      }
    };
    fetchBalances();
  }, [setBankData, setBankDataLoading]);

  const createAccountBalanceBreakdown = (
    bankData: BankData[],
    selectedCurrency: string
  ) => {
    // For each bank, sum the balances for the given selectedCurrency and return the list of bank names and total balances
    return bankData.map(({ bankName, balances }) => {
      const totalBalance = Object.values(balances).reduce(
        (acc, { amount, currency }) => {
          if (currency === selectedCurrency) {
            return acc + parseFloat(amount);
          }
          return acc;
        },
        0
      );

      return { bankName, totalBalance };
    });
  };

  const accountBalances = createAccountBalanceBreakdown(bankData, currency);
  console.log('Account balances:', accountBalances);

  //console.log("Fetching transaction data from store", typeof transactions, transactions);
  console.log('Fetching date range from store', dateRange);

  // Fetch the current expenditure and percentage difference
  const { currentExpenditure, percentageDifference } = fetchExpenditure(
    transactions,
    dateRange,
    currency
  );

  // Fetch the current income and percentage difference
  const { currentIncome, incomePercentageDifference } = fetchIncome(
    transactions,
    dateRange,
    currency
  );

  // Fetch  expense for current week
  const currentWeekExpenditure = fetchCurrentWeekExpenses(
    transactions,
    currency
  );

  // Calculate net income
  let netIncome = currentIncome - -currentExpenditure;
  // Round to 2 decimal places
  netIncome = Number(netIncome.toFixed(2));
  // Convert to string and add a + sign if positive or a - sign if negative
  const netIncomeString = (netIncome > 0 ? '+' : '') + netIncome;

  // Add + or - sign to percentage difference
  const percentageDifferenceString =
    (percentageDifference > 0 ? '+' : '') + percentageDifference;
  const incomePercentageDifferenceString =
    (incomePercentageDifference > 0 ? '+' : '') + incomePercentageDifference;


  if (loading) {
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
    <div className={"font-plex-mono"}>
      <div className="grid grid-cols-1 pb-8 pt-3 ">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex flex-row content-evenly justify-between pb-2">
              <CardDescription>
                <b className=" pl-1 text-xl font-semibold text-white lg:text-4xl">
                  {currencySymbol} {-1 * currentExpenditure}
                </b>{' '}
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
        {/*EXPENDITURE CARD*/}
        <Card className="bg-zinc-30  from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {'Expenditure'}
            </CardTitle>
            {/*  Currency icon */}
            {/*<CurrencyIcon className="h-4 w-4 text-muted-foreground" />{' '}*/}
            <p className={"h-5 w-4 text-muted-foreground"} style={{ fontSize: '1.1rem', position: 'relative', top: '-4px' }}>
            {currencySymbol}
          </p>
            {/* Use the capitalized variable here */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentExpenditure}</div>
            <p className="text-xs text-muted-foreground">
              {percentageDifferenceString}% from previous period
            </p>
          </CardContent>
        </Card>

        {/*INCOME CARD*/}
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

        {/*NET INCOME CARD*/}
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

        {/*BALANCE BREAKDOWN CARD*/}
        {/*<Card className="bg-zinc-30 dark:bg-zinc-950">*/}
        {/*  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
        {/*    <CardTitle className="text-sm font-medium">*/}
        {/*      {'Balance Breakdown'}*/}
        {/*    </CardTitle>*/}
        {/*    <Split className="h-4 w-4 text-muted-foreground" />*/}
        {/*  </CardHeader>*/}
        {/*  <CardContent>*/}
        {/*    <div className="flex items-center justify-center px-16">*/}
        {/*      <ResponsiveContainer width="100%" height={60}>*/}
        {/*        <Doughnut data={doughnutData} options={doughnutOptions} />*/}
        {/*      </ResponsiveContainer>*/}
        {/*    </div>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3 ">
        <ChatComponent />

        {/*<Card className="col-span-1">*/}
        {/*  <CardHeader>*/}
        {/*    <div className="flex items-center justify-between">*/}
        {/*      <CardTitle>Balance Breakdown</CardTitle>*/}
        {/*    </div>*/}
        {/*  </CardHeader>*/}
        {/*  <div className="-mt-5 mb-8 px-6">*/}
        {/*    <CardDescription></CardDescription>*/}
        {/*  </div>*/}
        {/*  <CardContent>*/}
        {/*    <div className="flex items-center justify-center">*/}
        {/*    <DoughnutChartCard accountBalances={accountBalances} currency={currency} />*/}
        {/*    </div>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}
        <Card className="col-span-1 bg-zinc-30 from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
          <CardHeader>
            <div className="flex items-center justify-between ">
              <CardTitle>Expense Breakdown</CardTitle>
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

        <Card className="col-span-1 bg-zinc-30 from-zinc-900 dark:bg-zinc-950 dark:hover:bg-gradient-to-br">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex items-center space-x-2">
                <Link href={'/transaction-history'}>
                  <SquareArrowOutUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </CardHeader>
          <div className="-mt-5 mb-8 px-6">
            <CardDescription></CardDescription>
          </div>
          <CardContent>
            <RecentExpensesTable transactions={transactions} />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
