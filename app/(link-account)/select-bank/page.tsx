import React from 'react';
import Image from "next/image";
import SelectBankForm from "@/components/forms/BankSelectForm";

const BankSelectPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="flex items-center mb-10">
          <Image
            src="/icons/logo.svg"
            alt="logo"
            width={30}
            height={30}
          />
          <div className="font-inter text-2xl font-bold ml-2 px-1">Compass</div>
        </div>
        <SelectBankForm />
      </div>
    </div>
  );
};

export default BankSelectPage;