import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  selectedCrypto: string;
  setSelectedCrypto: (crypto: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedCrypto, setSelectedCrypto] = useState('USDC');

  const togglePrivacyMode = () => {
    setPrivacyMode(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        privacyMode,
        togglePrivacyMode,
        selectedCurrency,
        setSelectedCurrency,
        selectedCrypto,
        setSelectedCrypto,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
