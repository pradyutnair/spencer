'use client';
import React, { useEffect, useState } from 'react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import Image from 'next/image';
import dashboard from '@/public/main-dashboard.png';
import dashboardCropped from '@/public/main-dashboard-cropped.png';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { TypewriterEffect } from '@/components/typewriter';
import { header } from '@/constants/data';
import { Features } from '@/components/landing-page/features';

export function HeroScrollDemo() {
  const [imageSrc, setImageSrc] = useState(dashboard);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setImageSrc(dashboardCropped);
        setIsMobile(true);
      } else {
        setImageSrc(dashboard);
        setIsMobile(false);
      }
    };

    handleResize(); // Set initial image source and mobile state
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="container">
            <div
              className={`flex items-center justify-center ${
                isMobile ? 'mt-[60rem]' : ''
              }`}
            >
              <a
                href="#"
                className="inline-flex gap-3 rounded-sm border border-white/30 px-2 py-1 "
              >
                <span className="bg-gradient-to-r from-[#F87AFF] to-[#2FD8FE] to-[#C3F0B2] to-[#FB93D0] to-[#FFDD99] bg-clip-text text-transparent">
                  Version 1.0 is here
                </span>
                <span className="inline-flex items-center justify-center gap-1">
                  <span className="opacity-75">Read More</span>
                  <ArrowRightIcon />
                </span>
              </a>
            </div>
            <div className="flex items-center justify-center">
              <TypewriterEffect
                words={header}
                className="text-center text-5xl font-bold sm:text-6xl "
              />
            </div>
            <div className="flex justify-center">
              <p className="mt-12 text-center text-xl text-zinc-400">
                Stay on top of your spending with ease and accuracy with
                Nexpass™, your smart expenditure tracking app that leverages AI
                assistance for precise and effortless financial calculations.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => window.open('/dashboard', '_blank')}
                className="shadow-w mb-12 rounded-sm bg-gradient-to-r from-gray-400 via-gray-600 to-red-500 px-8 py-3 font-semibold text-white"
              >
                Try now
              </button>
            </div>
          </div>
        }
      >
        <Image
          src={imageSrc}
          alt="hero"
          height={420}
          width={2800}
          className="mx-auto mb-24 h-full w-full rounded-2xl object-left-top"
          draggable={false}
        />
      </ContainerScroll>
      <div className={`flex justify-center ${isMobile ? 'mt-[48rem]' : ''}`}>
        <Features />
      </div>
    </div>
  );
}