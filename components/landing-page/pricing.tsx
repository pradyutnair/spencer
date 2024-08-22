// components/landing-page/pricing.tsx
'use client';
import React from 'react';
import { BackgroundGradient } from '../background-gradient';
import { Step } from '@/components/landing-page/special-card';

const paymentLink = process.env.STRIPE_PAYMENT_LINK_PROD!;
console.log('paymentLink', paymentLink);

export const PricingComponent = () => {
  return (
    <div id="pricing" className="flex flex-col items-center p-4 sm:p-10 mt-28 pb-28">
      <h1 className="text-center text-5xl font-bold sm:text-6xl mb-8">Pricing</h1>
      <div className="pb-4 pt-2 text-center text-xl opacity-60 sm:text-left mb-8 -mt-4 sm:text-2xl">
        One singular plan. One singular payment. Yours forever.
      </div>
      <BackgroundGradient className="rounded-[22px] max-w-sm w-full p-4 sm:p-10 bg-white dark:bg-[#120d1d]">
        <div className="text-center text-[#9967FF] sm:text-left mt-4">
          Basic Plan
        </div>
        <div className="my-5 flex items-baseline justify-center text-5xl font-bold sm:justify-start sm:text-6xl">
          <div className="flex items-baseline">
            <sup className="align-top text-2xl font-light sm:text-3xl">€</sup>
            <span className="text-5xl font-bold sm:text-6xl">9.99</span>
            {/*<span className="ml-2 text-xl font-light opacity-65 sm:text-2xl">*/}
            {/*  / month*/}
            {/*</span>*/}
          </div>
        </div>

        <ul className="list-none mt-2 mb-8 opacity-75 space-y-2 font-light">
          <Step title="Personal AI Financial Assistant" />
          <Step title="Unlimited secure bank connections" />
          <Step title="Expense tracking and automated reports" />
        </ul>
        <button
          onClick={() => window.open(paymentLink, '_blank')}
          className="inline-flex h-12 w-full animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#351561,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-white/50 transition transition-colors hover:text-white">
          Purchase
        </button>
      </BackgroundGradient>
    </div>
  );
};