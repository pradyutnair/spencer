'use client';

import { CardSpotlight } from "@/components/ui/card-spotlight";
import { CoffeeIcon, ShieldIcon, DollarSignIcon } from 'lucide-react';

export const Feature = ({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: React.ComponentType;
}) => {
  return (
    <CardSpotlight className="w-full sm:w-80 md:w-1/2 lg:w-1/3 xl:w-1/4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-white text-zinc-950">
        <Icon />
      </div>
      <p className="text-xl font-bold relative z-20 mt-2 text-white">
        {title}
      </p>
      <div className="text-neutral-200 mt-4 relative z-20">
        {description}
      </div>
    </CardSpotlight>
  );
};