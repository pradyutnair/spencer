// utils/currency-utils.ts
import { EuroIcon, Icon } from 'lucide-react';
import currencySymbolMap from 'currency-symbol-map';

export function getCurrencyIcon(currency: string): typeof Icon {
  // Return a default icon if the currency icon is not found
  return EuroIcon;
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbolMap(currency) || '€'; // Default to Euro symbol if not found
}