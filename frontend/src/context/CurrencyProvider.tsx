import React, { useState, useEffect } from 'react';
import { tripsApi } from '../services/api';
import { useAuth } from './AuthContext';
import { CurrencyContext, CurrencyCode, CURRENCY_SYMBOLS, EXCHANGE_RATES } from './CurrencyContext';

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
          // Profile returns unknown, cast as any temporarily or check properties safely
          const p = profile as { preferred_currency?: CurrencyCode } | null;
          if (p && p.preferred_currency) {
            setCurrencyState(p.preferred_currency);
            localStorage.setItem('voira_preferred_currency', p.preferred_currency);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const setCurrency = async (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('voira_preferred_currency', code);
    
    if (isAuthenticated) {
      try {
        const currentProfile = await tripsApi.getProfile();
        await tripsApi.updateProfile({
          ...(currentProfile as Record<string, unknown>),
          preferred_currency: code
        });
      } catch {
        // Ignored
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
