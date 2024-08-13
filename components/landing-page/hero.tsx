'use client';

import { ArrowRightIcon } from '@radix-ui/react-icons';

import Link from 'next/link';

import { Button } from '../ui/button';

export function Hero() {
  return (
    <div className="bg-gradient-to-b from-zinc-950 to-zinc-800/34 to-[#71717a] to-[#3f3f46_82%] py-[42px] sm:py-24 text-white relative overflow-clip mt-6">
      <div className="container">
        <div className="flex items-center justify-center">
          <a href="#" className="rounded-sm border border-white/30 px-2 py-1 inline-flex gap-3 ">
            <span className=" bg-gradient-to-r from-[#F87AFF] to-[#FB93D0] to-[#FFDD99] to-[#C3F0B2] to-[#2FD8FE] bg-clip-text text-transparent">
              Version 1.0 is here
            </span>
            <span className='inline-flex items-center gap-1 justify-center'>
              <span>Read More</span>
              <ArrowRightIcon />
            </span>
          </a>
        </div>
        <div className='flex justify-center'>
          <h1 className='text-5xl sm:text-6xl font-bold tracking-tight text-center mt-8 inline-flex max-w-sm'>Navigate through your expenses smarter</h1>
        </div>
        <div className='flex justify-center'>
          <p className='text-center text-xl mt-8'>
            Stay on top of your spending with ease and accuracy with Compass™,
            your smart expenditure tracking app that leverages AI assistance for
            precise and effortless financial calculations.
          </p>
        </div>
        <div className='flex justify-center mt-8'>
          <button className='bg-white text-black py-3 px-5 rounded-sm font-semibold'>Try now</button>
        </div>
      </div>
      <div className='absolute h-[375px] w-[1300px] rounded-[100%] sm:w-[3500px] sm:h-[800px] bg-zinc-950 left-1/2 -translate-x-1/2 blur-md '></div>
    </div>
    // <div className="mt-[240px] flex flex-col">
    //   <h1 className="mt-6 text-[30px] font-medium leading-none md:text-[90px]">
    //     Navigate through
    //     <br /> your expenses smarter.
    //   </h1>

    //   <p className="mt-4 max-w-[600px] text-[#878787] md:mt-6">
    //     Stay on top of your spending with ease and accuracy with Compass™, your
    //     smart expenditure tracking app that leverages AI assistance for precise
    //     and effortless financial calculations.
    //   </p>

    //   <div className="mt-8">
    //     <div className="flex items-center space-x-4">
    //       <a href="https://app.midday.ai">
    //         <Button className="h-12 px-8">Get Started</Button>
    //       </a>
    //     </div>
    //   </div>

    //   {/* <p className="mt-8 font-mono text-xs text-[#707070]">
    //     Used by over{' '}
    //     <Link href="/open-startup" prefetch>
    //       <span className="underline">1+</span>
    //     </Link>{' '}
    //     businesses.
    //   </p> */}
    // </div>
  );
}
