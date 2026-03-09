import { useEffect, useState } from 'react';
import { TrustwareProvider, TrustwareWidget, type TrustwareConfigOptions, type WalletInterFaceAPI } from '@trustware/sdk';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Avalanche C-Chain — Squid/Trustware uses numeric chainId as string
const AVAX_CHAIN = '43114';
// Standard ERC-20 sentinel for native token (Squid convention)
const NATIVE_AVAX = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const TRUSTWARE_API_KEY = import.meta.env.VITE_TRUSTWARE_API_KEY as string | undefined;

// XRamp theme mapped to Trustware theme shape
const TW_THEME = {
  primaryColor: '#19c5d6',      // XRamp cyan primary
  secondaryColor: '#0e9aa8',
  backgroundColor: '#101827',   // card background
  textColor: '#e8edf5',         // foreground
  borderColor: '#1a2236',       // border
  radius: 16,
};

const TW_MESSAGES = {
  title: 'Deposit via Trustware',
  description: 'Bridge any token from any chain — arrives as AVAX on Avalanche.',
};

export function TrustwareDepositWidget() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [walletApi, setWalletApi] = useState<WalletInterFaceAPI | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Build WalletInterFaceAPI from Privy's EIP-1193 provider
  useEffect(() => {
    if (!authenticated || wallets.length === 0) return;

    async function buildWalletApi() {
      try {
        const wallet = wallets[0];
        const provider = await wallet.getEthereumProvider();

        const api: WalletInterFaceAPI = {
          type: 'eip1193',
          request: (args) => provider.request(args as { method: string; params?: any[] }),
          getAddress: async () => wallet.address,
          getChainId: async () => {
            const hex = await provider.request({ method: 'eth_chainId' });
            return parseInt(hex as string, 16);
          },
          switchChain: async (chainId: number) => {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
          },
        };

        setWalletApi(api);
      } catch (e) {
        console.warn('TrustwareWidget: wallet API build failed', e);
        setInitError('Could not connect wallet to Trustware. Please refresh.');
      }
    }

    buildWalletApi();
  }, [authenticated, wallets]);

  if (!TRUSTWARE_API_KEY) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-500/90">
        Set <code className="font-mono">VITE_TRUSTWARE_API_KEY</code> in <code className="font-mono">.env</code> to enable the deposit widget.
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs text-destructive">
        {initError}
      </div>
    );
  }

  const config: TrustwareConfigOptions = {
    apiKey: TRUSTWARE_API_KEY,
    routes: {
      toChain: AVAX_CHAIN,
      toToken: NATIVE_AVAX,
      defaultSlippage: 1,
    },
    autoDetectProvider: false,
    theme: TW_THEME,
    messages: TW_MESSAGES,
  };

  return (
    <TrustwareProvider
      config={config}
      wallet={walletApi ?? undefined}
      autoDetect={false}
    >
      <TrustwareWidget />
    </TrustwareProvider>
  );
}
