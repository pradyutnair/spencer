// FILE: components/custom-card.tsx
'use client';
import React, { useMemo, Suspense } from 'react'; // Keep Suspense if needed for lazy loading charts
import { motion } from 'framer-motion'; // Import framer-motion
import {
    Coins,
    TrendingUp, // Changed from SquarePlus for Net Income
    TrendingDown, // For Expenditure
    Activity, // For Income (more dynamic than Coins)
    ExternalLinkIcon,
    Layers3,
    ScaleIcon, // Explicit balance icon
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
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js'; // Renamed Tooltip to avoid conflict
import { useBankStore } from '@/components/stores/bank-balances-store';
import ChatComponent from '@/components/chat/chat-ui';
import { getCurrencySymbol } from '@/lib/currency-mapping';
import { CategoryPieChart } from '@/components/category-pie-chart';
import BudgetComponent from '@/components/budget-progress';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Import Button
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip

ChartJS.register(ArcElement, ChartTooltip, Legend);

// Animation Variants
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1, // Stagger animation for child cards
        },
    },
};

// Main Card Component
const CustomCard: React.FC<{ firstname: string }> = ({ firstname }) => {
    const { transactions, loading: transactionsLoading, error: transactionError } = useTransactionContext();
    const { bankDataLoading, error: bankError } = useBankStore();
    const { dateRange } = useDateRangeStore();
    const { currency } = useCurrencyStore();

    const currencySymbol = getCurrencySymbol(currency);
    const [showExpenses, setShowExpenses] = React.useState(true);

    const { currentExpenditure, percentageDifference } = useMemo(
        () => fetchExpenditure(transactions, dateRange, currency),
        [transactions, dateRange, currency]
    );

    const { currentIncome, incomePercentageDifference } = useMemo(
        () => fetchIncome(transactions, dateRange, currency),
        [transactions, dateRange, currency]
    );

    const netIncome = useMemo(() => {
        const income = currentIncome || 0;
        const expenditure = currentExpenditure || 0; // Already negative
        return Number((income + expenditure).toFixed(2));
    }, [currentIncome, currentExpenditure]);

    const netIncomeString = (netIncome >= 0 ? '+' : '') + netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const expenditureString = Math.abs(currentExpenditure).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const incomeString = currentIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const percentageDifferenceString = (percentageDifference > 0 ? '+' : '') + percentageDifference.toFixed(1);
    const incomePercentageDifferenceString = (incomePercentageDifference >= 0 ? '+' : '') + incomePercentageDifference.toFixed(1);

    const isLoading = transactionsLoading || bankDataLoading;
    const hasError = transactionError || bankError;

    // Loading Skeleton UI
    if (isLoading) {
        return (
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
                    <motion.div variants={cardVariants}><SkeletonCard /></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard /></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard /></motion.div>
                </motion.div>
                <motion.div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 h-[450px]" variants={containerVariants}>
                    <motion.div variants={cardVariants}><SkeletonCard /></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard /></motion.div>
                    <motion.div variants={cardVariants}><SkeletonCard /></motion.div>
                </motion.div>
            </motion.div>
        );
    }

    // Error UI
    if (hasError) {
        return <div className="text-red-500 p-4 text-center font-semibold">Error loading dashboard data: {transactionError || bankError}</div>;
    }

    // Main Content UI with Animations
    return (
        <TooltipProvider delayDuration={100}> {/* Tooltip Provider for the whole section */}
            <motion.div
                className={"font-inter space-y-6"} // Add spacing between sections
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Main Chart Card - Enhanced */}
                <motion.div variants={cardVariants}>
                    <Card className="col-span-1 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border border-transparent hover:border-primary/20">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                            <div>
                                <CardTitle className="text-base font-semibold mb-1">Financial Overview</CardTitle>
                                <CardDescription className="text-xs">
                                    {showExpenses ? 'Expenditure' : 'Income'} Trend
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2 scale-90 origin-right"> {/* Scale switch slightly */}
                                <Label htmlFor="transaction-type" className="text-xs select-none">
                                    {showExpenses ? 'Expenses' : 'Income'}
                                </Label>
                                <Switch
                                    id="transaction-type"
                                    checked={showExpenses}
                                    onCheckedChange={setShowExpenses}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-3xl font-bold mb-2">
                                {currencySymbol} {showExpenses ? expenditureString : incomeString}
                            </div>
                            <div className="h-[200px]"> {/* Fixed height container for chart */}
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

                {/* Summary Cards - Enhanced */}
                <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
                    {/* Expenditure Card */}
                    <motion.div variants={cardVariants}>
                        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border border-transparent hover:border-red-500/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Expenditure</CardTitle>
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currencySymbol}{expenditureString}</div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className={cn("text-xs mt-1 cursor-default", percentageDifference >= 0 ? "text-red-500" : "text-green-500")}>
                                            {percentageDifferenceString}%
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Change vs previous period</p>
                                    </TooltipContent>
                                </Tooltip>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Income Card */}
                    <motion.div variants={cardVariants}>
                        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border border-transparent hover:border-green-500/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Income</CardTitle>
                                <Activity className="h-5 w-5 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{currencySymbol}{incomeString}</div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className={cn("text-xs mt-1 cursor-default", incomePercentageDifference >= 0 ? "text-green-500" : "text-red-500")}>
                                            {incomePercentageDifferenceString}%
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Change vs previous period</p>
                                    </TooltipContent>
                                </Tooltip>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Net Income Card */}
                    <motion.div variants={cardVariants}>
                        {/* Added subtle border variation */}
                        <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/50 dark:hover:bg-zinc-900 border border-primary/10 hover:border-primary/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
                                <ScaleIcon className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", netIncome >= 0 ? "text-green-500" : "text-red-500")}>
                                    {netIncomeString} {currencySymbol}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 h-4"> {/* Keep placeholder for alignment */}
                                    Total income minus expenditure
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Lower Section: AI Chat, Pie Chart, Budget */}
                <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-3 h-full lg:h-[450px]" variants={containerVariants}>
                    {/* AI Chat Component */}
                    <motion.div className="lg:col-span-1 h-full" variants={cardVariants}>
                        <ChatComponent />
                    </motion.div>

                    {/* Expense Breakdown Pie Chart */}
                    <motion.div className="lg:col-span-1 h-96" variants={cardVariants}>
                         <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-zinc-900/50 dark:hover:bg-zinc-900 flex flex-col h-full border border-transparent hover:border-primary/20">
                            <CardHeader className="pb-2 pt-4 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
                                    <Layers3 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardDescription className="text-xs">Spending by category</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center p-2">
                                <CategoryPieChart transactions={transactions} currency={currency} />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Budget Component */}
                    <motion.div className="lg:col-span-1 relative flex flex-col h-96" variants={cardVariants}>
                        <BudgetComponent transactions={transactions} useColorScheme={false} />
                        <div className="absolute top-2 right-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={"/my-banks"} aria-label="View Budgets and Banks">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted/50">
                                            <ExternalLinkIcon className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View Budgets / Manage Banks</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
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