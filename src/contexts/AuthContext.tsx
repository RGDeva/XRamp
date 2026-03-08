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
    privySub?: string;
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
  // Re-run whenever authenticated or wallets change so the token is always fresh
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
  }, [authenticated, wallets, getAccessToken]);

  const getWalletSigner = useCallback(async (): Promise<ethers.Signer> => {
    // Prefer external wallet (Core) so user signs with the wallet they connected
    const external = wallets.find(w => w.walletClientType !== 'privy');
    const embedded = wallets.find(w => w.walletClientType === 'privy');
    const wallet = external || embedded;
    if (!wallet) throw new Error('No wallet connected');

    const provider = await wallet.getEthereumProvider();

    // Switch to Fuji — try Privy's switchChain first, then fall back to
    // wallet_addEthereumChain (required for external wallets like Core that
    // don't have Fuji pre-configured).
    try {
      await wallet.switchChain(FUJI_CHAIN_ID);
    } catch {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${FUJI_CHAIN_ID.toString(16)}`,
            chainName: 'Avalanche Fuji Testnet',
            nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://testnet.snowtrace.io'],
          }],
        });
      } catch {
        // If add also fails (user rejected), continue — tx will fail with a clear error
      }
    }

    const browserProvider = new ethers.BrowserProvider(provider);
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
        privySub: user.id,
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
