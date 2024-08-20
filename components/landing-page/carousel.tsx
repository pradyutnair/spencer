'use client';

import React from 'react';
import { InfiniteMovingCards } from '../infinite-moving-cards';
import { TextGenerateEffect } from '../text-generator-effect';

export function Carousel() {
  return (
    <div className=" bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-950 pb-20">
      <div className="flex justify-center font-bold sm:text-6xl">
        <TextGenerateEffect
          className="text-6xl font-extrabold"
          duration={4}
          words={"You're in good company"}
          filter={false}
        />
      </div>
      {/*  Create a smaller sentence*/}
      <div className="mx-auto max-w-lg">
        <p className="text-center text-xl text-white/70 sm:text-2xl pb-10">
            ❤️ by our users

        </p>
      </div>
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="slow"
      />
    </div>
  );
}

const testimonials = [
  {
    name: 'Yeshas Paramesh',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1bDzHn2OWkQFbEWO-04wyEDRZkOu06Q3U',
    handle: '@yeshas_paramesh',
    verified: true,
    quote: "This is exactly what I've been looking for🚀"
  },
  {
    name: 'Tanishq Rao',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1bKZ0xUyS-YaB0F_MswowSqhnBlQ_gKKA',
    handle: '@arcticbugbear',
    verified: true,
    quote: 'Omg, this is so cool!'
  },
  {
    name: 'Riteesh A',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1b7E4Mk7Wf1TyT35N-Fe-Z_yClVFvYyS6',
    handle: '@kamikazayy',
    verified: true,
    quote: 'Kudos to the team!👏 I was really impressed by the design and assistant'
  },
  {
    name: 'Saakshi Vivek',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1bA8G29vt1YhrE77gLpKf9Dg3jXzuIjqV',
    handle: '@saaki',
    verified: true,
    quote: 'Awesome man, looks amazing 🔥'
  },
  {
    name: 'Pradyut Nair',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1bBbWUviW2-jIZ3DORKluhKQXZarQrQR5',
    handle: '@pradyutnair',
    verified: true,
    quote: 'Love the dashboard UI🖤'
  },
  {
    name: 'Shane Mathias',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1bNj6Q61ArBGWDHfsIneFsNe3VKdCJxWt',
    handle: '@mathy777',
    verified: true,
    quote: "I'd use it"
  },
  {
    name: 'Jash V Gandhi',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1awwKdvqILB-J9YcREnQBA0_xTFRWKAtf',
    handle: '@jashvgandhi',
    verified: true,
    quote: 'so ready! 🙌'
  },
  {
    name: 'Adhit Ganapathy',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1b6My5Fz4eEKobfih_3r6weyScvTjGYnJ',
    handle: '@biggannu',
    verified: true,
    quote: `Just found the only finance app I'll ever need👏`
  },
  {
    name: 'Gokul',
    avatarUrl:
      'https://drive.google.com/uc?export=view&id=1sHNK7ALSI9FGkTfP0-sUWXfm0z-m4j9z',
    handle: '@KyTechInc',
    verified: true,
    quote: '🖤 Awesome work. just love it.'
  }
];
