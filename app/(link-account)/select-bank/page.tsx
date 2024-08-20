import React from 'react';
import Image from 'next/image';
import SelectBankForm from '@/components/forms/BankSelectForm';

const BankSelectPage = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="mb-10 flex items-center">
          <Image src="/icons/logo.svg" alt="logo" width={30} height={30} />
          <div className="font-inter ml-2 px-1 text-2xl font-bold">Compass</div>
        </div>
        <SelectBankForm />
      </div>
    </div>
  );
};

export default BankSelectPage;