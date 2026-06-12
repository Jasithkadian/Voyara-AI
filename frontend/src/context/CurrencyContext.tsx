import React, { createContext, useContext, useState, useEffect } from 'react';
import { tripsApi } from '../services/api';
import { useAuth } from './AuthContext';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

interface CurrencyContextType {
  currency: CurrencyCode;
  currencySymbol: string;
  convertPrice: (priceInINR: number) => number;
  formatPrice: (priceInINR: number) => string;
  setCurrency: (code: CurrencyCode) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

// Static conversion rates from INR to other currencies
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  INR: 1.0,
  USD: 0.012, // 1 USD = 83.3 INR
  EUR: 0.011, // 1 EUR = 90.9 INR
  GBP: 0.0093, // 1 GBP = 107.5 INR
  AED: 0.044, // 1 AED = 22.7 INR
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('voira_preferred_currency');
    return (saved as CurrencyCode) || 'INR';
  });

  // Fetch backend preference on login/auth
  useEffect(() => {
    if (isAuthenticated) {
      tripsApi.getProfile()
        .then((profile) => {
          if (profile && profile.preferred_currency) {
            setCurrencyState(profile.preferred_currency);
            localStorage.setItem('voira_preferred_currency', profile.preferred_currency);
          }
        })
        .catch((err) => );
    }
  }, [isAuthenticated]);

  const setCurrency = async (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('voira_preferred_currency', code);
    
    if (isAuthenticated) {
      try {
        const currentProfile = await tripsApi.getProfile();
        await tripsApi.updateProfile({
          ...currentProfile,
          preferred_currency: code
        });
      } catch (err) {
        
      }
    }
  };

  const convertPrice = (priceInINR: number) => {
    return priceInINR * EXCHANGE_RATES[currency];
  };

  const formatPrice = (priceInINR: number) => {
    const converted = convertPrice(priceInINR);
    
    // Custom formatting for AED as it places symbol at end or has specific locales
    if (currency === 'AED') {
      return `${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(converted)} AED`;
    }
    
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      currencySymbol: CURRENCY_SYMBOLS[currency],
      convertPrice,
      formatPrice,
      setCurrency
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
