import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface Balance {
    amount: string;
    currency: string;
}

interface CreditCardProps {
    balances: Balance[];
    showBalance?: boolean;
    bankName: string;
    bankLogo?: string;
}

const BankCard = ({ balances, showBalance = true, bankName, bankLogo = '/icons/mastercard.svg' }: CreditCardProps) => {
    const aggregatedBalances = balances.reduce((acc: { [key: string]: number }, balance) => {
        acc[balance.currency] = (acc[balance.currency] || 0) + parseFloat(balance.amount);
        return acc;
    }, {});

    const nonZeroBalances = Object.entries(aggregatedBalances).filter(([_, amount]) => amount > 0);

    const displayBankName = bankName.split(/[^a-zA-Z ]/g)[0].toLowerCase().replace(/^\w/, c => c.toUpperCase());

    return (
      <div className="flex items-center justify-center mt-9">
        <Card className="w-full m-4">
          <div className="flex justify-between items-center">
            <CardHeader>
              <CardTitle>{displayBankName}</CardTitle>
            </CardHeader>
            <Image src={bankLogo} width={45} height={32} alt="bank logo" className="ml-2 mr-3.5" />
          </div>
          <CardContent>
            <div className="grid gap-4">
              {nonZeroBalances.map(([currency, amount], index) => (
                <div className="grid grid-cols-2 items-center gap-2" key={index}>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{currency}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {showBalance ? `${amount.toFixed(2)}` : 'Hidden'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
};

export default BankCard;