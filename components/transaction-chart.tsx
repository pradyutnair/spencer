'use client';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { startOfMonth } from 'date-fns';
import { Transaction } from '@/types/index';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { Icon } from 'lucide-react';
import { useCurrencyStore } from '@/components/stores/currency-store';

interface TransactionChartProps {
  transactions: Transaction[];
  dateRange: DateRange | undefined;
  showExpenses: boolean;
  setShowExpenses: (showExpenses: boolean) => void;
}

const TransactionChart: React.FC<TransactionChartProps> = ({ transactions,
                                                             dateRange, showExpenses, setShowExpenses,
                                                           }) => {

  const {currency, setCurrency} = useCurrencyStore();
  // Get the text symbol for the currency by using format
  let currencySymbol = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(0).replace(/\d/g, '');
  // remove any whitespace or commas or periods
  currencySymbol = currencySymbol.replace(/[\s,.$]/g, '');

  // Determine the date range, defaulting to the start of the month to today
  const from = dateRange?.from || startOfMonth(new Date());
  const to = dateRange?.to || new Date();

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.bookingDate);
    return transactionDate >= from && transactionDate <= to && transaction.currency === currency;
  });

  const aggregatedData: { [key: string]: number } = {};

  filteredTransactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.bookingDate).toISOString().split('T')[0];
    const amount = showExpenses ? Math.abs(transaction.amount) : transaction.amount;

    if (showExpenses && transaction.amount < 0) {
      aggregatedData[transactionDate] = (aggregatedData[transactionDate] || 0) + amount;
    } else if (!showExpenses && transaction.amount > 0) {
      aggregatedData[transactionDate] = (aggregatedData[transactionDate] || 0) + amount;
    }
  });

  const data = Object.keys(aggregatedData).map((date) => ({
    bookingDate: date,
    amount: aggregatedData[date],
  }));

  data.sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());

  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    let shownAmount = Number(payload?.[0]?.value).toFixed(2);
    let dateLabel = dayjs(label).format('DD MMM YYYY');
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip text-black" style={{ backgroundColor: '#ffffff', border: '1px solid #888888', padding: '5px', borderRadius: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
          <p className="label">{`Date: ${dateLabel}`}</p>
          <p className="intro">{`Amount: ${currencySymbol}${shownAmount}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/*<div className="flex items-center justify-end space-x-2 mb-4 px-4">*/}
      {/*  <Switch*/}
      {/*    id="transaction-type"*/}
      {/*    checked={showExpenses}*/}
      {/*    onCheckedChange={() => setShowExpenses(!showExpenses)}*/}
      {/*  />*/}
      {/*  <Label htmlFor="transaction-type">{showExpenses ? "Expenses" : "Income"}</Label>*/}
      {/*</div>*/}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis
            dataKey="bookingDate"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(str) => dayjs(str).format('DD MMM')}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(136, 136, 136, 0.1)' }}
          />
          <Bar dataKey="amount" fill={showExpenses ? "#008080" : "#888888"} radius={[4, 4, 0, 0]} fillOpacity={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;
