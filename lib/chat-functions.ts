import { Transaction } from '@/types/index';
import { format, parse, isValid } from 'date-fns';
import { formatAmount } from '@/lib/utils';

export const getCategoryTotalWithinTimeFrame = (
  transactions: any[],
  category: string,
  startDate: string,
  endDate: string
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  console.log('start', start);
  console.log('end', end);
  console.log('category', category);

  // Format date as dd mmm yyyy using date-fns
  const startDateFormatted = format(start, 'dd MMM');
  const endDateFormatted = format(end, 'dd MMM');
  const year = format(start, 'yyyy');


  let total = transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.bookingDate);
      return transaction.category === category && transactionDate >= start && transactionDate <= end;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  total = Math.abs(total);
  let formattedTotal = formatAmount(total);

  return `You spent ${formattedTotal} on ${category} between the ${startDateFormatted} and ${endDateFormatted} of ${year}.`;
};



export const findSpecificTransaction = (
  transactions: any[],
  bookingDate: string,
  startDate?: string,
  endDate?: string,
  Payee?: string,
) => {
  // Check if startDate and endDate are provided
  let start: Date, end: Date;
  let filteredTransactions;

  if (startDate && endDate) {
    // Convert startDate and endDate to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.bookingDate);
      const isDateInRange = transactionDate >= start && transactionDate <= end;
      const isPayeeMatch = Payee ? transaction.Payee && transaction.Payee.toLowerCase().includes(Payee.toLowerCase()) : true;
      return isDateInRange && isPayeeMatch;
    });
  } else {
    // Convert bookingDate to Date object
    const date = new Date(bookingDate);

    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.bookingDate);
      const isDateMatch = transactionDate.toDateString() === date.toDateString();
      const isPayeeMatch = Payee ? transaction.Payee && transaction.Payee.toLowerCase().includes(Payee.toLowerCase()) : true;
      return isDateMatch && isPayeeMatch;
    });
  }

  // Filter the transactions for 31st July 2024 and with payee = 'Sreedevi Kumari'
  const customFilteredTransactions = transactions.filter(transaction => {
    return transaction.bookingDate === '2024-07-31' && transaction.Payee === 'Sreedevi Kumari';
  });

  console.log('filteredTransactions', filteredTransactions);
  //console.log('customFilteredTransactions', customFilteredTransactions);


  if (filteredTransactions.length === 0) {
    if (startDate && endDate) {
    return `No transaction found${Payee ? ` for ${Payee}` : ''} between ${format(start, 'dd MMM yyyy')} and ${format(end, 'dd MMM yyyy')}.`;
  } else {
    return `No transaction found${Payee ? ` for ${Payee}` : ''} on ${format(new Date(bookingDate), 'dd MMM yyyy')}.`
    }
  }

  // Create the output message for each transaction
  let totalAmount = 0
  const outputs = filteredTransactions.map(transaction => {
    const isSpent = transaction.amount < 0;
    const total = Math.abs(transaction.amount);
    const formattedAmount = formatAmount(total);
    const formattedDate = format(new Date(transaction.bookingDate), 'dd MMM yyyy');

    let output = isSpent
      ? `You spent ${formattedAmount} at ${transaction.Payee} on ${formattedDate}.`
      : `You received ${formattedAmount} from ${transaction.Payee} on ${formattedDate}.`;

    output += ` The transaction falls in the ${transaction.category} category.`;
    totalAmount += total;
    return output;
  });

  // Result statements
  let result = outputs.join(' ');
  // Add the total amount spent or received
  result += `The total amount is ${formatAmount(totalAmount)}.`;
  return result;
};


export const summarizeTransactions = (
  transactions: Transaction[],
  options?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    payee?: string;
    summaryType?: 'total' | 'average' | 'largest' | 'smallest' | 'count';
  }
) => {
  // Apply filters based on the options provided
  let filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.bookingDate);
    let includeTransaction = true;

    if (options?.category && transaction.category !== options.category) {
      includeTransaction = false;
    }
    if (options?.startDate && transactionDate < new Date(options.startDate)) {
      includeTransaction = false;
    }
    if (options?.endDate && transactionDate > new Date(options.endDate)) {
      includeTransaction = false;
    }
    if (options?.minAmount && transaction.amount < options.minAmount) {
      includeTransaction = false;
    }
    if (options?.maxAmount && transaction.amount > options.maxAmount) {
      includeTransaction = false;
    }
    if (options?.payee && !transaction.Payee.toLowerCase().includes(options.payee.toLowerCase())) {
      includeTransaction = false;
    }

    return includeTransaction;
  });

  // Handle different summary types
  let summary: string;
  switch (options?.summaryType) {
    case 'average':
      const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const average = totalAmount / filteredTransactions.length;
      summary = `The average spending is ${formatAmount(average)}.`;
      break;

    case 'largest':
      const largestTransaction = filteredTransactions.reduce((max, transaction) => transaction.amount > max.amount ? transaction : max, filteredTransactions[0]);
      summary = `The largest transaction was ${formatAmount(largestTransaction.amount)} on ${largestTransaction.bookingDate} with ${largestTransaction.Payee}.`;
      break;

    case 'smallest':
      const smallestTransaction = filteredTransactions.reduce((min, transaction) => transaction.amount < min.amount ? transaction : min, filteredTransactions[0]);
      summary = `The smallest transaction was ${formatAmount(smallestTransaction.amount)} on ${smallestTransaction.bookingDate} with ${smallestTransaction.Payee}.`;
      break;

    case 'count':
      summary = `There are ${filteredTransactions.length} transactions that match the criteria.`;
      break;

    case 'total':
    default:
      const total = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      summary = `The total amount spent is ${formatAmount(total)}.`;
      break;
  }

  // Add time frame and category to the summary if provided
  if (options?.category || options?.startDate || options?.endDate) {
    const category = options?.category ? `on ${options.category}` : '';
    const startDateFormatted = options?.startDate ? format(new Date(options.startDate), 'dd MMM') : '';
    const endDateFormatted = options?.endDate ? format(new Date(options.endDate), 'dd MMM yyyy') : '';
    const dateRange = options?.startDate && options?.endDate ? ` between ${startDateFormatted} and ${endDateFormatted}` : '';

    summary += ` ${category}${dateRange}.`;
  }

  return summary;
};

export const getPredictedExpenditureUsingRegression = (transactions: Transaction[]) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDayOfMonth = now.getDate();

  // Prepare daily spending data
  const dailySpending = Array(daysInMonth).fill(0);
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.bookingDate);
    if (transactionDate >= startOfMonth && transactionDate <= now) {
      const day = transactionDate.getDate();
      // Consider only negative amounts (expenses) and take absolute value
      if (transaction.amount < 0) {
        dailySpending[day - 1] += Math.abs(transaction.amount);
      }
    }
  });

  // Prepare data for linear regression
  const x = [];
  const y: number[] = [];
  let cumulativeSpending = 0;
  for (let i = 0; i < currentDayOfMonth; i++) {
    cumulativeSpending += dailySpending[i];
    x.push(i + 1);
    y.push(cumulativeSpending);
  }

  // Calculate the regression coefficients
  const n = x.length;
  const sumX = x.reduce((acc, val) => acc + val, 0);
  const sumY = y.reduce((acc, val) => acc + val, 0);
  const sumXY = x.reduce((acc, val, idx) => acc + val * y[idx], 0);
  const sumX2 = x.reduce((acc, val) => acc + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict the total expenditure for the last day of the month
  const predictedExpenditure = slope * daysInMonth + intercept;

  return `The predicted expenditure for the current month is ${predictedExpenditure.toFixed(2)}.`;
};


