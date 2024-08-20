"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";
import dashboard from '@/public/main-dashboard.png';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { TypewriterEffect } from '@/components/typewriter';
import { header } from '@/constants/data';
import { Features } from '@/components/landing-page/features';

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="container">
            <div className="flex items-center justify-center">
              <a href="#" className="rounded-sm border border-white/30 px-2 py-1 inline-flex gap-3 ">
            <span
              className=" bg-gradient-to-r from-[#F87AFF] to-[#FB93D0] to-[#FFDD99] to-[#C3F0B2] to-[#2FD8FE] bg-clip-text text-transparent">
              Version 1.0 is here
            </span>
                <span className='inline-flex items-center gap-1 justify-center'>
              <span className={'opacity-75'}>Read More</span>
              <ArrowRightIcon />
            </span>
              </a>
            </div>
            <div className='flex justify-center items-center'>
              <TypewriterEffect words={header} className='text-5xl sm:text-6xl font-bold text-center ' />
              {/* <h1 className='text-5xl sm:text-6xl font-bold tracking-tight text-center mt-8 inline-flex max-w-sm'>Navigate through your expenses smarter</h1> */}
            </div>
            <div className='flex justify-center'>
              <p className='text-center text-xl mt-12 text-zinc-400'>
                Stay on top of your spending with ease and accuracy with Compass™,
                your smart expenditure tracking app that leverages AI assistance for
                precise and effortless financial calculations.
              </p>
            </div>
            <div className='flex justify-center mt-8'>
              <button className='bg-gradient-to-r from-gray-400 via-gray-600 to-red-500 text-white py-3 px-5 rounded-sm font-semibold mb-10 shadow-w'>Try now</button>
            </div>
          </div>
        }
      >
        <Image
          src={dashboard}
          alt="hero"
          height={720}
          width={2800}
          className="mx-auto rounded-2xl h-full w-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>

      <Features />
    </div>
  );
}
