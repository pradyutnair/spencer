import {
  EuroIcon,
  DollarSignIcon,
  PoundSterling,
  IndianRupeeIcon,
  SquarePlus,
  Coins,
  Split,
  SquareArrowOutUpRight
} from 'lucide-react';

import { Icon } from 'lucide-react';
// Create a dictionary to map currency symbols to their respective icons
const currencyIconMap: { [key: string]: typeof Icon } = {
  EUR: EuroIcon,
  USD: DollarSignIcon,
  GBP: PoundSterling,
  INR: IndianRupeeIcon,
};

