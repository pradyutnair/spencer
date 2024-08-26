'use client';
import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { getCurrencySymbol } from '@/lib/currency-mapping';
import { transactionCategories } from '@/lib/transactionCategoryDefinitions';

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value
  } = props;
  const currencySymbol = getCurrencySymbol(payload.currency);
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
      />
      <text
        x={cx}
        y={cy + 5}
        dy={-10}
        textAnchor="middle"
        fill={fill}
        fontFamily="Inter"
        fontWeight="500"
        fontSize="16px"
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 5}
        dy={10}
        textAnchor="middle"
        fill={fill}
        fontFamily="Inter"
        fontWeight="500"
        fontSize="15px"
      >
        {`${currencySymbol}${Math.round(value)} `}
      </text>
    </g>
  );
};

export function CategoryPieChart({ transactions, currency } : { transactions: any[], currency: string }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedBank, setSelectedBank] = useState("All Banks");
  const { dateRange } = useDateRangeStore();
  const fromDate = dateRange?.from;
  const toDate = dateRange?.to;

  const bankNames = useMemo(() => {
    const banks = new Set(transactions.map(t => t.Bank).filter(Boolean));
    return ["All Banks", ...Array.from(banks)];
  }, [transactions]);

  const data = useMemo(() => {
    const filteredTransactions = transactions.filter(t => {
      const bookingDate = new Date(t.bookingDate);
      return (!fromDate || bookingDate >= new Date(fromDate)) && (!toDate || bookingDate <= new Date(toDate));
    }).filter(t => selectedBank === "All Banks" || t.Bank === selectedBank);

    const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
      if (!transaction.exclude && transaction.category && transaction.category !== "Income") {
        acc[transaction.category] = (acc[transaction.category] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    }, {});

    return transactionCategories.map(category => ({
      name: category.name,
      value: Math.round(categoryTotals[category.name] || 0),
      color: category.lightColor,
      darkColor: category.darkColor,
      currency: currency
    }));
  }, [transactions, currency, selectedBank, fromDate, toDate]);

  const onPieEnter = (_: any, index: any) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  const processBankName = (bankName: string) => {
    const name = bankName.split(/[^a-zA-Z0-9 ]/g)[0].toLowerCase();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="flex flex-col h-full w-full justify-center -mt-20 font-inter">
      <div className="flex items-center justify-center w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="justify-center flex flex-wrap -mt-16">
        <Select value={selectedBank} onValueChange={setSelectedBank}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a bank" />
          </SelectTrigger>
          <SelectContent>
            {bankNames.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {processBankName(bank)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}