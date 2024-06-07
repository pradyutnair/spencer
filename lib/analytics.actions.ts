'use client';
import { useTransactionStore } from '@/components/stores/transaction-store';
import { useDateRangeStore } from '@/components/stores/date-range-store';
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, subYears, startOfYear, endOfYear } from 'date-fns';
import { Transaction } from '@/types/index';
import { DateRange } from 'react-day-picker';

function calculatePreviousPeriod(from: Date, to: Date): { previousStart: Date, previousEnd: Date } {
  const daysDiff = (to.getTime() - from.getTime()) / (1000 * 3600 * 24);

  if (daysDiff <= 7) { // Weekly
    return {
      previousStart: startOfWeek(subWeeks(from, 1)),
      previousEnd: endOfWeek(subWeeks(to, 1))
    };
  } else if (daysDiff <= 31) { // Monthly
    return {
      previousStart: startOfMonth(subMonths(from, 1)),
      previousEnd: endOfMonth(subMonths(to, 1))
    };
  } else if (daysDiff <= 365) { // Yearly
    return {
      previousStart: startOfYear(subYears(from, 1)),
      previousEnd: endOfYear(subYears(to, 1))
    };
  } else { // Custom period
    const previousStart = new Date(from);
    previousStart.setFullYear(previousStart.getFullYear() - 1);

    const previousEnd = new Date(to);
    previousEnd.setFullYear(previousEnd.getFullYear() - 1);

    return {
      previousStart,
      previousEnd
    };
  }
}

export function fetchExpenditure(transactions: any, dateRange: any) {
  // Determine the date range, defaulting to the start of the month to today
  const from = dateRange?.from || startOfMonth(new Date());
  const to = dateRange?.to || new Date();

  // Calculate the previous period based on the current date range
  const { previousStart, previousEnd } = calculatePreviousPeriod(from, to);
  console.log("Previous period", previousStart, previousEnd);

  // Filter transactions to only include those that have EUR currency
  transactions = transactions.filter((transaction: { currency: string; }) => transaction.currency === 'EUR');

  // Calculate the total expenditure within the current date range
  let currentExpenditure = transactions.reduce((total: any, transaction: { bookingDate: string | number | Date; amount: number; }) => {
    const transactionDate = new Date(transaction.bookingDate);
    if (transactionDate >= from && transactionDate <= to && transaction.amount < 0) {
      total += transaction.amount;
    }
    return total;
  }, 0);

  // Calculate the total expenditure for the previous period
  let previousExpenditure = transactions.reduce((total: any, transaction: { bookingDate: string | number | Date; amount: number; }) => {
    const transactionDate = new Date(transaction.bookingDate);
    if (transactionDate >= previousStart && transactionDate <= previousEnd && transaction.amount < 0) {
      total += transaction.amount;
    }
    return total;
  }, 0);

  // Calculate the percentage difference between current and previous expenditures
  let percentageDifference = previousExpenditure !== 0
    ? ((currentExpenditure - previousExpenditure) / Math.abs(previousExpenditure)) * 100
    : currentExpenditure > 0 ? 100 : 0;

  currentExpenditure = Number(currentExpenditure.toFixed(2));

  percentageDifference = Number(percentageDifference.toFixed(2));

  return {
    currentExpenditure,
    percentageDifference
  };
}

export function fetchIncome(transactions: any, dateRange: any){
  // Determine the date range, defaulting to the start of the month to today
  const from = dateRange?.from || startOfMonth(new Date());
  const to = dateRange?.to || new Date();

  // Calculate the previous period based on the current date range
  const { previousStart, previousEnd } = calculatePreviousPeriod(from, to);

  transactions = transactions.filter((transaction: { currency: string; }) => transaction.currency === 'EUR');

  // Calculate the total income within the current date range
  let currentIncome = transactions.reduce((total: any, transaction: { bookingDate: string | number | Date; amount: number; }) => {
    const transactionDate = new Date(transaction.bookingDate);
    if (transactionDate >= from && transactionDate <= to && transaction.amount > 0) {
      total += transaction.amount;
    }
    return total;
  }, 0);

  // Calculate the total income for the previous period
  let previousIncome = transactions.reduce((total: any, transaction: { bookingDate: string | number | Date; amount: number; }) => {
    const transactionDate = new Date(transaction.bookingDate);
    if (transactionDate >= previousStart && transactionDate <= previousEnd && transaction.amount > 0) {
      total += transaction.amount;
    }
    return total;
  }, 0);

  // Calculate the percentage difference between current and previous incomes
  let incomePercentageDifference = previousIncome !== 0
    ? ((currentIncome - previousIncome) / Math.abs(previousIncome)) * 100
    : currentIncome > 0 ? 100 : 0;

  currentIncome = Number(currentIncome.toFixed(2));
  incomePercentageDifference = Number(incomePercentageDifference.toFixed(2));

  return {
    currentIncome,
    incomePercentageDifference
  };

}
