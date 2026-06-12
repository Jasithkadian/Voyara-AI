import { createContext, useContext } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

interface CurrencyContextType {
  currency: CurrencyCode;
  currencySymbol: string;
  convertPrice: (priceInINR: number) => number;
  formatPrice: (priceInINR: number) => string;
  setCurrency: (code: CurrencyCode) => Promise<void>;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

// Static conversion rates from INR to other currencies
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  INR: 1.0,
  USD: 0.012, // 1 USD = 83.3 INR
  EUR: 0.011, // 1 EUR = 90.9 INR
  GBP: 0.0093, // 1 GBP = 107.5 INR
  AED: 0.044, // 1 AED = 22.7 INR
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
