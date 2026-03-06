import { createContext, useContext, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { setAuthToken } from '@/lib/orchestratorApi';
import { FUJI_CHAIN_ID } from '@/lib/fuji';

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
  /** Raw Privy wallets for on-chain signing */
  wallets: ConnectedWallet[];
  /** Get an ethers.js signer from the best available wallet, switched to Fuji */
  getWalletSigner: () => Promise<ethers.Signer>;
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

  const getWalletSigner = useCallback(async (): Promise<ethers.Signer> => {
    // Prefer embedded wallet (always available for Privy users), fall back to external
    const embedded = wallets.find(w => w.walletClientType === 'privy');
    const external = wallets.find(w => w.walletClientType !== 'privy');
    const wallet = embedded || external;
    if (!wallet) throw new Error('No wallet connected');

    // Switch to Fuji if not already
    try {
      await wallet.switchChain(FUJI_CHAIN_ID);
    } catch {
      // switchChain may throw if already on the right chain or unsupported — continue
    }

    const ethereumProvider = await wallet.getEthereumProvider();
    const browserProvider = new ethers.BrowserProvider(ethereumProvider);
    return browserProvider.getSigner();
  }, [wallets]);

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
      wallets,
      getWalletSigner,
    };
  }, [ready, authenticated, user, wallets, login, logout, connectWallet, getWalletSigner]);

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
