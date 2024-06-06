// app/my-banks/page.tsx
import React, { Suspense } from 'react';
import BankCard from '@/components/BankCard';
import BankCardSkeleton from '@/components/skeletons/BankCardSkeleton';
import { getBankData } from '@/lib/bank.actions';
import { BankData } from '@/types';

// Wrapper component to fetch data and pass it as props
const MyBanks = () => {
    return (
        <Suspense fallback={<SkeletonFallback />}>
            <AsyncMyBanks />
        </Suspense>
    );
};

// Component to render the actual data
const AsyncMyBanks = async () => {
    // Fetch the bank data
    const bankData: BankData[] = await getBankData();

    return (
        <section className='flex'>
            <div className="my-banks">
                <div className="w-full p-4 overflow-hidden">
                    <h1 className="text-2xl font-bold mb-4 font-inter w-full pt-8 px-4">Your Cards</h1>
                    <div className="flex flex-wrap gap-6">
                        {bankData && bankData.map(({ requisitionId, bankName, bankLogo, balances }) => (
                          Object.entries(balances).map(([accountId, balance]) => (
                            <BankCard
                              key={accountId}
                              balances={balance}
                              userName={'Geeky'}
                              bankName={bankName}
                              bankLogo={bankLogo}
                            />
                          ))
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Component to render while loading
const SkeletonFallback = () => (
    <section className='flex'>
        <div className="my-banks">
            <div className="w-full p-4 overflow-hidden">
                <h1 className="text-2xl font-bold mb-4 font-inter w-full pt-8 px-4">Your Cards</h1>
                <div className="flex flex-wrap gap-6 px-4">
                    <BankCardSkeleton />
                    <BankCardSkeleton />
                    <BankCardSkeleton />
                </div>
            </div>
        </div>
    </section>
);

export default MyBanks;
