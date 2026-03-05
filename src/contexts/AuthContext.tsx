import { createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { setAuthToken } from '@/lib/orchestratorApi';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email?: string;
    walletAddress?: string;
    embeddedWalletAddress?: string;
  } | null;
  login: () => void;
  logout: () => Promise<void>;
  connectWallet: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout, 
    connectWallet,
    getAccessToken,
  } = usePrivy();
  const { wallets } = useWallets();

  // Sync Privy access token into the orchestrator API client
  useEffect(() => {
    if (authenticated) {
      getAccessToken().then((token) => {
        setAuthToken(token);
      }).catch(() => {
        setAuthToken(null);
      });
    } else {
      setAuthToken(null);
    }
  }, [authenticated, getAccessToken]);

  const authState = useMemo<AuthState>(() => {
    const email = user?.email?.address;
    const embeddedWallet = user?.wallet;
    const externalWallet = wallets.find(w => w.walletClientType !== 'privy');
    
    return {
      isAuthenticated: authenticated,
      isLoading: !ready,
      user: authenticated && user ? {
        email,
        walletAddress: externalWallet?.address,
        embeddedWalletAddress: embeddedWallet?.address,
      } : null,
      login,
      logout,
      connectWallet,
    };
  }, [ready, authenticated, user, wallets, login, logout, connectWallet]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get display address (truncated)
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// Helper to get delivery address (embedded or external)
export function getDeliveryAddress(user: AuthState['user']): string | null {
  if (!user) return null;
  return user.walletAddress || user.embeddedWalletAddress || null;
}
