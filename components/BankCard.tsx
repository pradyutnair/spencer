import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { JSX, ReactNode, PromiseLikeOfReactNode } from "react";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { router } from 'next/client';

interface Balance {
  amount: string;
  currency: string;
}

interface CreditCardProps {
  requisitionId: string;
  balances: Balance[];
  showBalance?: boolean;
  bankName: string;
  bankLogo?: string;
  reqCreated: string;
}

const BankCard = ({
                    requisitionId,
                    balances,
                    showBalance = true,
                    bankName,
                    bankLogo = '/icons/mastercard.svg',
                    reqCreated
                  }: CreditCardProps) => {
  const aggregatedBalances = balances.reduce((acc: { [key: string]: number }, balance) => {
    acc[balance.currency] = (acc[balance.currency] || 0) + parseFloat(balance.amount);
    return acc;
  }, {});

  const nonZeroBalances = Object.entries(aggregatedBalances).filter(([_, amount]) => amount > 0);

  const displayBankName = bankName.split(/[^a-zA-Z0-9 ]/g)[0].toLowerCase().replace(/^\w/, c => c.toUpperCase());
  // Get the number of days between the requisition creation date + 120 days and today
  let daysToExpire = Math.ceil((new Date(reqCreated).getTime() + 120 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
  //daysToExpire = 0

  // Format the days to expire with a text
  let expiryDays = daysToExpire > 0 ? `${daysToExpire} days` : 'Expired';

  // If expired, color the text red
  let formattedDaysToExpire: string | number | boolean | JSX.Element | Iterable<ReactNode> | PromiseLikeOfReactNode | null | undefined;
  if (daysToExpire <= 0) {
    formattedDaysToExpire =
      <span className="text-sm font-medium text-red-500 dark:text-red-400">
        {expiryDays}
      </span>;
  } else {
    formattedDaysToExpire = <span className="text-sm font-medium text-green-700 dark:text-green-400 opacity-85">{expiryDays}</span>;
  }

  const renewBankAccess = async () => {
  console.log('Renewing access for requisition:', requisitionId);
  try {
    const response = await fetch('/api/renewBankAccess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requisitionId: requisitionId })
    });

    if (response.ok) {
      const data = await response.json();
      const gcRenewalUrl = data.link;
      console.log('Renewal URL:', gcRenewalUrl);
      // Save the requisition ID in localStorage
      localStorage.setItem('newRequisitionDetails', JSON.stringify({
        newRequisitionId: data.requisitionId,
        oldRequisitionId: requisitionId,
      }));
      // Redirect to the GoCardless renewal page
      window.location.href = gcRenewalUrl;
    } else {
      console.error('Network response was not ok');
    }
  } catch (error) {
    console.error('Error renewing access:', error);
    // Handle error (e.g., show an error message)
  }
};

  return (
    <div className="flex items-center justify-center mt-9 w-full">
      <Card className="w-full m-4">
        <div className="flex justify-between items-center">
          <CardHeader>
            <CardTitle>{displayBankName}</CardTitle>
          </CardHeader>
          <Image src={bankLogo} width={45} height={32} alt="bank logo" className="ml-2 mr-3.5" />
        </div>
        <CardContent>
          <div className="grid grid-cols-1 items-center mr-32">
            {nonZeroBalances.map(([currency, amount], index) => (
              <div className="grid grid-cols-2 items-center gap-6" key={index}>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{currency}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {showBalance ? `${amount.toFixed(2)}` : 'Hidden'}
                </div>
                <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  Validity
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The number of days until access to transaction data from {displayBankName} expires.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-50"> {formattedDaysToExpire}</div>
              </div>
            ))}
          </div>
        </CardContent>
        {daysToExpire <= 0 && (
          <CardFooter>
            <Button onClick={renewBankAccess}>
              Renew access
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
export default BankCard;