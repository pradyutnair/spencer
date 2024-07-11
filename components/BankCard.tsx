import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Balance {
    amount: string;
    currency: string;
}

interface CreditCardProps {
    balances: Balance[];
    userName: string;
    showBalance?: boolean;
    bankName: string;
    bankLogo?: string;
}

const aggregateBalances = (balances: Balance[]) => {
    return balances.reduce((acc: { [key: string]: number }, balance) => {
        if (!acc[balance.currency]) {
            acc[balance.currency] = 0;
        }
        acc[balance.currency] += parseFloat(balance.amount);
        return acc;
    }, {});
};

const BankCard = ({ balances, userName, showBalance = true, bankName, bankLogo }: CreditCardProps) => {
    if (!Array.isArray(balances)) {
        balances = [{ amount: "0", currency: 'USD' }];
    }
    if (!bankLogo) {
        bankLogo = '/icons/mastercard.svg';
    }

    const aggregatedBalances = aggregateBalances(balances);

    // Remove special characters and split the bank name and show only the first word
    let displayBankName = bankName.split(/[^a-zA-Z ]/g)[0].toLowerCase()
    displayBankName = displayBankName.charAt(0).toUpperCase() + displayBankName.slice(1);

    return (
      <div className="flex items-center justify-center mt-9">
          {Object.keys(aggregatedBalances).map((currency, index) => {
              const amount = aggregatedBalances[currency];
              return (
                <Card className="w-full m-4" key={index}>
                    <div className="flex justify-between items-center">
                    <CardHeader>
                        <CardTitle>{displayBankName}</CardTitle>
                        <CardDescription>View and manage your {displayBankName} account details.</CardDescription>
                    </CardHeader>
                    <Image src={bankLogo} width={45} height={32} alt="bank logo" className="ml-2 mr-3.5" />
                    </div>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 items-center gap-2">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                    {showBalance ? `${amount.toFixed(2)} ${currency}` : 'Hidden'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              );
          })}
      </div>
    );
};

export default BankCard;
