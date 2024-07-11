'use client';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Transaction } from '@/types/index';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { useCurrencyStore } from '@/components/stores/currency-store';

export default function SelectCurrency(): JSX.Element {
  const { transactions, loading, setTransactions, setLoading } = useTransactionStore();
  const { currency, setCurrency } = useCurrencyStore();
  const currencies: string[] = Array.from(new Set(transactions.map((transaction: Transaction) => transaction.currency)));

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  return (
    <div className="flex items-center space-x-2">
      <Select defaultValue={currency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select a currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {currencies.map((currency) => (
              <SelectItem key={currency} value={currency}>
                <SelectLabel>{currency}</SelectLabel>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}