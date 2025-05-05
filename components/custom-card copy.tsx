'use client';
import React, { useEffect } from 'react';
import { Coins, ExternalLinkIcon, Layers3, SquarePlus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  TransactionProvider,
  useTransactionContext
} from '@/hooks/transaction-context';
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
  const { bankDataLoading } = useBankStore();
  const { dateRange } = useDateRangeStore();
  const { currency } = useCurrencyStore();

  const currencySymbol = getCurrencySymbol(currency);
  const [showExpenses, setShowExpenses] = React.useState(true);

  // useEffect(() => {
  //   fetchBankData();
  // }, [fetchBankData]);

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
    <div className={"font-inter dark:text-white light:text-black"}>
      <div className="grid grid-cols-1 pb-8 pt-3 ">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex flex-row content-evenly justify-between pb-2">
              <CardDescription>
                <b className="pl-1 text-xl font-semibold lg:text-4xl dark:text-white light:text-black">
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
            <div className="flex items-center justify-center font-inter">
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
//
// FILE: components/custom-card.tsx
'use client';
import React, { useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
    Coins,
    TrendingUp,
    TrendingDown,
    Activity,
    ExternalLinkIcon,
    Layers3,
    Scale, // Changed from ScaleIcon for balance/net flow
    ArrowRight,
    ListChecks, // For Top Categories
    AlertCircle, // For Large Transactions
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { TransactionProvider, useTransactionContext } from '@/hooks/transaction-context';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { fetchExpenditure, fetchIncome } from '@/lib/analytics.actions';
import { SkeletonCard } from '@/components/skeletons/card-skeleton';
import TransactionChart from '@/components/transaction-chart';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCurrencyStore } from '@/components/stores/currency-store';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { useBankStore } from '@/components/stores/bank-balances-store';
import ChatComponent from '@/components/chat/chat-ui';
import { getCurrencySymbol } from '@/lib/currency-mapping';
import { CategoryPieChart } from '@/components/category-pie-chart';
import BudgetComponent from '@/components/budget-progress'; // Assuming this handles its own data/state
import Link from 'next/link';
import { cn, formatAmount } from '@/lib/utils'; // Ensure formatAmount is imported
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator'; // Import Separator
import { Transaction } from '@/types'; // Import Transaction type

ChartJS.register(ArcElement, ChartTooltip, Legend);

// --- Animation Variants ---
const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
    hidden: { opacity: 1 }, // Start visible to avoid initial blank state if JS disabled
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // Faster stagger
        },
    },
};

// --- Helper: Top Spending Categories ---
const TopSpendingCategories = ({ transactions, currency, count = 3 }: { transactions: Transaction[], currency: string, count?: number }) => {
    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        transactions.forEach(t => {
            if (!t.exclude && t.category && t.category !== "Income" && t.amount < 0) {
                totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
            }
        });
        return Object.entries(totals)
            .sort(([, a], [, b]) => b - a) // Sort descending
            .slice(0, count); // Take top 'count'
    }, [transactions, count]);

    if (categoryTotals.length === 0) {
        return <p className="text-xs text-muted-foreground text-center py-4">No spending data for this period.</p>;
    }

    return (
        <div className="space-y-2">
            {categoryTotals.map(([category, total]) => (
                <div key={category} className="flex justify-between items-center text-xs">
                    <span className="font-medium truncate pr-2">{category}</span>
                    <span className="font-mono font-semibold text-red-500 whitespace-nowrap">
                        {formatAmount(total, currency)}
                    </span>
                </div>
            ))}
        </div>
    );
};

// --- Helper: Recent Large Transactions ---
const RecentLargeTransactions = ({ transactions, currency, count = 3 }: { transactions: Transaction[], currency: string, count?: number }) => {
    const largeExpenses = useMemo(() => {
        return transactions
            .filter(t => !t.exclude && t.amount < 0) // Only expenses
            .sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount)) // Sort by absolute amount desc
            .slice(-count) // Take largest 'count'
            .reverse(); // Show largest first
    }, [transactions, count]);

     if (largeExpenses.length === 0) {
        return <p className="text-xs text-muted-foreground text-center py-4">No large expenses found.</p>;
    }

    return (
        <div className="space-y-2">
            {largeExpenses.map((t) => (
                <div key={t.$id || t.transactionId} className="flex justify-between items-center text-xs">
                    <div className="truncate pr-2">
                        <span className="font-medium block">{t.Payee}</span>
                        <span className="text-muted-foreground block">{new Date(t.bookingDate).toLocaleDateString('en-CA')}</span> {/* YYYY-MM-DD */}
                    </div>
                    <span className="font-mono font-semibold text-red-500 whitespace-nowrap">
                        {formatAmount(t.amount, currency)}
                    </span>
                </div>
            ))}
        </div>
    );
}


// --- Main Card Component ---
const CustomCard: React.FC<{ firstname: string }> = ({ firstname }) => {
    const { transactions, loading: transactionsLoading, error: transactionError } = useTransactionContext();
    const { bankDataLoading, error: bankError } = useBankStore();
    const { dateRange } = useDateRangeStore();
    const { currency } = useCurrencyStore();

    const currencySymbol = getCurrencySymbol(currency);
    const [showExpenses, setShowExpenses] = React.useState(true);

    // Memoize calculations
    const { currentExpenditure, percentageDifference } = useMemo(
        () => fetchExpenditure(transactions, dateRange, currency),
        [transactions, dateRange, currency]
    );
    const { currentIncome, incomePercentageDifference } = useMemo(
        () => fetchIncome(transactions, dateRange, currency),
        [transactions, dateRange, currency]
    );
    const netIncome = useMemo(() =>
        Number(((currentIncome || 0) + (currentExpenditure || 0)).toFixed(2)),
        [currentIncome, currentExpenditure]
    );

    // Formatters
    const formatValue = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatPercentage = (value: number) => (value >= 0 ? '+' : '') + value.toFixed(1) + '%';

    // Loading & Error States
    const isLoading = transactionsLoading || bankDataLoading;
    const hasError = transactionError || bankError;

    if (isLoading) {
        // Keep existing skeleton structure
        return (
             <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
                {/* Placeholder for Overview Chart */}
                <motion.div variants={cardVariants}><SkeletonCard className="h-[300px]"/></motion.div>
                 {/* Placeholder for Summary Cards */}
                <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
                    <motion.div variants={cardVariants}><SkeletonCard className="h-[120px]"/></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard className="h-[120px]"/></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard className="h-[120px]"/></motion.div>
                </motion.div>
                 {/* Placeholder for Lower Section */}
                <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-3 h-[450px]" variants={containerVariants}>
                    <motion.div variants={cardVariants}><SkeletonCard className="h-full"/></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard className="h-full"/></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard className="h-full"/></motion.div>
                </motion.div>
            </motion.div>
        );
    }

    if (hasError) {
        return <div className="text-red-500 p-4 text-center font-semibold">Error loading dashboard data: {transactionError || bankError}</div>;
    }

    // --- Main Content ---
    return (
        <TooltipProvider delayDuration={150}>
            <motion.div
                className="font-inter space-y-6 md:space-y-8" // Increased spacing
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* --- Top Section: Overview Chart --- */}
                <motion.div variants={cardVariants}>
                    <Card className="col-span-1 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 border dark:border-zinc-800 hover:border-primary/20">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-4 px-5">
                            <div>
                                <CardTitle className="text-base font-semibold">Financial Flow</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    {showExpenses ? 'Expenditure' : 'Income'} Trend for selected period
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="transaction-type" className="text-xs select-none cursor-pointer">
                                    Show {showExpenses ? 'Income' : 'Expenses'}
                                </Label>
                                <Switch
                                    id="transaction-type"
                                    checked={showExpenses}
                                    onCheckedChange={setShowExpenses}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pb-4">
                             {/* Main value display removed, chart implies it */}
                            <div className="h-[220px]"> {/* Slightly taller chart */}
                                <TransactionChart
                                    transactions={transactions}
                                    dateRange={dateRange}
                                    showExpenses={showExpenses}
                                    setShowExpenses={setShowExpenses}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* --- Middle Section: Summary Cards --- */}
                <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
                    {/* Expenditure Card */}
                    <motion.div variants={cardVariants}>
                        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 border dark:border-zinc-800 hover:border-red-600/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className="text-2xl font-bold">{currencySymbol}{formatValue(Math.abs(currentExpenditure))}</div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className={cn("text-xs mt-1", percentageDifference >= 0 ? "text-red-500" : "text-green-500")}>
                                            {formatPercentage(percentageDifference)} vs prev.
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Compared to previous period</p></TooltipContent>
                                </Tooltip>
                            </CardContent>
                        </Card>
                    </motion.div>
                    {/* Income Card */}
                    <motion.div variants={cardVariants}>
                         <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 border dark:border-zinc-800 hover:border-green-600/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className="text-2xl font-bold">+{currencySymbol}{formatValue(currentIncome)}</div>
                                <Tooltip>
                                     <TooltipTrigger asChild>
                                        <p className={cn("text-xs mt-1", incomePercentageDifference >= 0 ? "text-green-500" : "text-red-500")}>
                                            {formatPercentage(incomePercentageDifference)} vs prev.
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Compared to previous period</p></TooltipContent>
                                </Tooltip>
                            </CardContent>
                        </Card>
                    </motion.div>
                    {/* Net Flow Card */}
                    <motion.div variants={cardVariants}>
                        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 border dark:border-zinc-800 hover:border-blue-600/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Net Flow</CardTitle>
                                <Scale className="h-5 w-5 text-blue-500" />
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <div className={cn("text-2xl font-bold", netIncome >= 0 ? "text-green-500" : "text-red-500")}>
                                    {netIncome >= 0 ? '+' : ''}{currencySymbol}{formatValue(netIncome)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 h-4">
                                    Income - Expenses
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* --- Bottom Section: Details & AI --- */}
                {/* Adjusted grid layout for better balance */}
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 h-full lg:h-[450px]" variants={containerVariants}>

                    {/* Spending Distribution & Top Categories */}
                    <motion.div className="lg:col-span-1" variants={cardVariants}>
                         <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 flex flex-col h-full border dark:border-zinc-800 hover:border-purple-500/30">
                            <CardHeader className="pb-2 pt-4 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold">Spending Analysis</CardTitle>
                                    <Layers3 className="h-4 w-4 text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col p-3 space-y-3">
                                <div className="flex-shrink-0 h-[180px] flex items-center justify-center"> {/* Chart Area */}
                                     <CategoryPieChart transactions={transactions} currency={currency} />
                                </div>
                                <Separator className="my-2 dark:bg-zinc-700"/>
                                <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin"> {/* Top Categories List */}
                                     <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Categories</h4>
                                     <TopSpendingCategories transactions={transactions} currency={currency} count={4} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Budget Tracking & Highlights */}
                    <motion.div className="lg:col-span-1" variants={cardVariants}>
                        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 flex flex-col h-full border dark:border-zinc-800 hover:border-orange-500/30">
                           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                                <CardTitle className="text-sm font-semibold">Budget & Highlights</CardTitle>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href={"/my-banks"} aria-label="Manage Budgets and Banks">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-muted/50">
                                                <ExternalLinkIcon className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Manage Budgets / Banks</p></TooltipContent>
                                </Tooltip>
                            </CardHeader>
                             <CardContent className="flex-grow flex flex-col p-3 space-y-3 overflow-hidden">
                                <div className="flex-grow overflow-y-auto scrollbar-thin pr-1">
                                    {/* Budget component takes remaining space */}
                                     <BudgetComponent transactions={transactions} useColorScheme={false} />
                                </div>
                                <Separator className="my-2 dark:bg-zinc-700"/>
                                 <div className="flex-shrink-0 space-y-2">
                                     <h4 className="text-xs font-semibold text-muted-foreground mb-1">Largest Expenses</h4>
                                     <RecentLargeTransactions transactions={transactions} currency={currency} count={3} />
                                 </div>
                             </CardContent>
                        </Card>
                    </motion.div>

                    {/* AI Chat Component - Takes remaining 2 cols on lg */}
                    <motion.div className="md:col-span-2 lg:col-span-2 h-full" variants={cardVariants}>
                        <ChatComponent />
                    </motion.div>

                </motion.div>
            </motion.div>
        </TooltipProvider>
    );
};

// Wrapper remains the same
const CustomCardWrapper: React.FC<{ firstname: string }> = ({ firstname }) => (
  <TransactionProvider>
    <CustomCard firstname={firstname} />
  </TransactionProvider>
);

export default CustomCardWrapper;