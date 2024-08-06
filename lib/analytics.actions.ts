'use client';
import { endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { Transaction } from '@/types/index';
import { DateRange } from 'react-day-picker';
import { calculatePreviousPeriod } from '@/lib/utils';

function filterTransactionsByCurrency(transactions: Transaction[], currency: string) {
  return transactions.filter(transaction => transaction.currency === currency);
}

function calculateTotal(transactions: Transaction[], from: Date, to: Date, isIncome: boolean) {
  return transactions.reduce((total, transaction) => {
    const transactionDate = new Date(transaction.bookingDate);
    if (transactionDate >= from && transactionDate <= to && (isIncome ? transaction.amount > 0 : transaction.amount < 0)) {
      total += transaction.amount;
    }
    return total;
  }, 0);
}

function calculatePercentageDifference(current: number, previous: number) {
  return previous !== 0
    ? ((Math.abs(current) - Math.abs(previous)) / Math.abs(previous)) * 100
    : current > 0
    ? 100
    : 0;
}

export function fetchExpenditure(transactions: Transaction[], dateRange: DateRange, currency: string) {
  const from = dateRange?.from || startOfMonth(new Date());
  const to = dateRange?.to || new Date();
  const { previousStart, previousEnd } = calculatePreviousPeriod(from, to);

  const filteredTransactions = filterTransactionsByCurrency(transactions, currency);
  const currentExpenditure = calculateTotal(filteredTransactions, from, to, false);
  const previousExpenditure = calculateTotal(filteredTransactions, previousStart, previousEnd, false);

  return {
    currentExpenditure: Number(currentExpenditure.toFixed(2)),
    percentageDifference: Number(calculatePercentageDifference(currentExpenditure, previousExpenditure).toFixed(2))
  };
}

export function fetchIncome(transactions: Transaction[], dateRange: DateRange, currency: string) {
  const from = dateRange?.from || startOfMonth(new Date());
  const to = dateRange?.to || new Date();
  const { previousStart, previousEnd } = calculatePreviousPeriod(from, to);

  const filteredTransactions = filterTransactionsByCurrency(transactions, currency);
  const currentIncome = calculateTotal(filteredTransactions, from, to, true);
  const previousIncome = calculateTotal(filteredTransactions, previousStart, previousEnd, true);

  return {
    currentIncome: Number(currentIncome.toFixed(2)),
    incomePercentageDifference: Number(calculatePercentageDifference(currentIncome, previousIncome).toFixed(2))
  };
}

export function fetchCurrentWeekExpenses(transactions: Transaction[], currency: string) {
  const from = startOfWeek(new Date());
  const to = endOfWeek(new Date());

  const filteredTransactions = filterTransactionsByCurrency(transactions, currency);
  const currentExpenditure = calculateTotal(filteredTransactions, from, to, false);

  return Math.abs(Number(currentExpenditure.toFixed(2)));
}