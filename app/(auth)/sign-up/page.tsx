import React from 'react';
import { SignUpForm } from '@/components/forms/SignupForm';
import Image from 'next/image';

const SignUpPage = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="flex h-svh flex-col items-center justify-center">
        <div className="mb-10 flex items-center justify-center">
          <Image
            src={'/icons/logo-v1.svg'}
            alt={'logo'}
            className={'halo rounded-lg'}
            width={30}
            height={30}
          />
          <div className="font-ibm-plex-serif ml-2 px-1 text-2xl font-bold">
            Nexpass
          </div>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
};

export default SignUpPage;