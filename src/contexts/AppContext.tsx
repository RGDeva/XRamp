import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
}

interface AppContextType {
  wallet: WalletState;
  connectWallet: () => void;
  disconnectWallet: () => void;
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  selectedCrypto: string;
  setSelectedCrypto: (crypto: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0.00',
  });
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedCrypto, setSelectedCrypto] = useState('USDC');

  const connectWallet = () => {
    // Simulated wallet connection
    setWallet({
      isConnected: true,
      address: '0x1234...5678',
      balance: '2,450.00',
    });
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      balance: '0.00',
    });
  };

  const togglePrivacyMode = () => {
    setPrivacyMode(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
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
