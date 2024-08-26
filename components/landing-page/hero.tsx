'use client';

import { ArrowRightIcon } from '@radix-ui/react-icons';
import { TypewriterEffect } from '../typewriter';
import { header } from '@/constants/data';

export function Hero() {
  return (
    <div className="to-zinc-800/34 relative mt-6 overflow-clip bg-gradient-to-b from-zinc-950 to-[#3f3f46_82%] to-[#71717a] py-[42px] text-white sm:py-24">
      <div className="container">
        <div className="flex items-center justify-center">
          <a
            href="#"
            className="inline-flex gap-3 rounded-sm border border-white/30 px-2 py-1 "
          >
            <span className=" bg-gradient-to-r from-[#F87AFF] to-[#2FD8FE] to-[#C3F0B2] to-[#FB93D0] to-[#FFDD99] bg-clip-text text-transparent">
              Version 1.0 is here
            </span>
            <span className="inline-flex items-center justify-center gap-1">
              <span>Read More</span>
              <ArrowRightIcon />
            </span>
          </a>
        </div>
        <div className="flex items-center justify-center">
          <TypewriterEffect
            words={header}
            className="text-center text-5xl font-bold sm:text-6xl "
          />
          {/* <h1 className='text-5xl sm:text-6xl font-bold tracking-tight text-center mt-8 inline-flex max-w-sm'>Navigate through your expenses smarter</h1> */}
        </div>
        <div className="flex justify-center">
          <p className="mt-12 text-center text-xl">
            Stay on top of your spending with ease and accuracy with Nexpass™,
            your smart expenditure tracking app that leverages AI assistance for
            precise and effortless financial calculations.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <button className="rounded-sm bg-white px-8 py-4 text-lg font-semibold text-black">
            Try now
          </button>
        </div>
      </div>
      <div className="absolute left-1/2 h-[375px] w-[1300px] -translate-x-1/2 rounded-[100%] bg-zinc-950 blur-md sm:h-[800px] sm:w-[3500px] "></div>
    </div>
    // <div className="mt-[240px] flex flex-col">
    //   <h1 className="mt-6 text-[30px] font-medium leading-none md:text-[90px]">
    //     Navigate through
    //     <br /> your expenses smarter.
    //   </h1>

    //   <p className="mt-4 max-w-[600px] text-[#878787] md:mt-6">
    //     Stay on top of your spending with ease and accuracy with Nexpass™, your
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
