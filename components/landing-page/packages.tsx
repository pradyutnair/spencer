"use client";
import { BackgroundGradient } from "../background-gradient";

export const PackagesComponent = () => {
    return (
        <div className="mt-28 pb-28">
            <h1 className="text-center text-5xl sm:text-6xl font-bold">
                Pricing
            </h1>
            <div className="container py-10 px-4 sm:px-12 lg:px-[calc(500px)]">
                <BackgroundGradient className="rounded-[22px] p-4 sm:p-6 bg-white dark:bg-[#120d1d]">
                    <div className="text-[#9967FF] text-center sm:text-left">Basic Plan</div>
                    <div className="text-5xl sm:text-6xl my-5 font-bold flex items-baseline justify-center sm:justify-start">
                        <div className="flex items-baseline">
                            <sup className="text-2xl sm:text-3xl font-light align-top">€</sup>
                            <span className="text-5xl sm:text-6xl font-bold">9.99</span>
                            <span className="text-xl sm:text-2xl font-light opacity-65 ml-2">/ month</span>
                        </div>
                    </div>
                    <div className="pt-2 pb-4 font-semibold opacity-60 text-center sm:text-left">
                        One singular plan for all your needs
                    </div>
                    <button className="w-full inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#351561,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-white/50 transition-colors transition hover:text-white">
                        Purchase
                    </button>
                    <ul className="py-6 font-normal text-center sm:text-left">
                        <li className="pb-2">First Feature</li>
                        <li className="pb-2">Second Feature</li>
                        <li className="pb-2">24/7 customer support</li>
                    </ul>
                </BackgroundGradient>
            </div>
        </div>
    );
};