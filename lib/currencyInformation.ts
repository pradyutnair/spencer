import {
  DollarSignIcon,
  EuroIcon,
  Icon,
  IndianRupeeIcon,
  PoundSterling
} from 'lucide-react';
// Create a dictionary to map currency symbols to their respective icons
const currencyIconMap: { [key: string]: typeof Icon } = {
  EUR: EuroIcon,
  USD: DollarSignIcon,
  GBP: PoundSterling,
  INR: IndianRupeeIcon,
};

