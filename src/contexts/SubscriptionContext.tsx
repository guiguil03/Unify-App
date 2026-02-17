import React, { createContext, useState, useEffect, useContext } from 'react';
import { SubscriptionService } from '../services/SubscriptionService';

interface SubscriptionContextData {
  isPremium: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextData>({} as SubscriptionContextData);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      const premium = await SubscriptionService.isPremium();
      setIsPremium(premium);
    } catch (error) {
      if (__DEV__) console.error('Subscription load failed:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription doit être utilisé à l\'intérieur d\'un SubscriptionProvider');
  }
  return context;
}



