import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Image from 'next/image';
import { JSX, PromiseLikeOfReactNode, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

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
  let daysToExpire = Math.ceil((new Date(reqCreated).getTime() + 120 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000));
  //daysToExpire = 0
  let expiryDays = daysToExpire > 0 ? `${daysToExpire} days` : 'Expired';

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
        localStorage.setItem('newRequisitionDetails', JSON.stringify({
          newRequisitionId: data.requisitionId,
          oldRequisitionId: requisitionId,
        }));
        window.location.href = gcRenewalUrl;
      } else {
        console.error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error renewing access:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-9 w-full">
      <Card className="w-full m-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <CardHeader>
            <CardTitle>{displayBankName}</CardTitle>
          </CardHeader>
          <Image src={bankLogo} width={45} height={32} alt="bank logo" className="ml-2 mr-3.5" />
        </div>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nonZeroBalances.map(([currency, amount], index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{currency}:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{showBalance ? `${amount.toFixed(2)}` : 'Hidden'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Validity:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{formattedDaysToExpire}</span>
                </div>
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