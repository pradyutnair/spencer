'use client';

import Image from 'next/image';
import dashboard from '@/public/Main_Dashboard.png';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export const ProductShowCase = () => {
  const appImage = useRef<HTMLImageElement>(null);
  const { scrollYProgress } = useScroll({
    target: appImage,
    offset: ['start end', 'end start']
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5], [25, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [0, 1]);
  return (
    <div className="bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-500 py-[72px] text-white sm:py-24">
      <div className="container">
        <h2 className="text-center text-5xl font-bold tracking-tighter sm:text-6xl">
          Keep track
        </h2>
        <div className="mx-auto max-w-xl">
          <p className="mt-5 text-center text-xl text-white/70">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua
          </p>
        </div>
        <motion.div
          ref={appImage}
          style={{
            opacity: opacity,
            rotateX: rotateX,
            transformPerspective: '800px'
          }}
        >
          <Image
            src={dashboard}
            alt="Dashboard screenshot"
            className="mt-14 rounded-sm border-2 border-zinc-950/70"
          />
        </motion.div>
      </div>
    </div>
  );
};