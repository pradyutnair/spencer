import React from 'react';
import LinkBankAccountButton from '@/components/buttons/link-bank-account';
import AsyncMyBanks from '@/components/AsyncBankDetails';

// Wrapper component to fetch data and pass it as props
const MyBanks = () => {
    return (
      <section className="flex">
        <div className="my-banks w-full p-4 overflow-hidden mt-7 px-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-inter">
              Your Banks
            </h1>
            <LinkBankAccountButton />
          </div>
          <AsyncMyBanks />
        </div>
      </section>
    );
};




export default MyBanks;
