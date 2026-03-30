import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { avalancheFuji, avalanche } from '@privy-io/chains';
import { ReactNode } from 'react';

const PRIVY_APP_ID = 'cmkcshfa402kxi20ce4puhb3t';

interface PrivyWrapperProps {
  children: ReactNode;
}

export function PrivyWrapper({ children }: PrivyWrapperProps) {
  return (
    <PrivyProviderBase
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#22d3ee',
          showWalletLoginFirst: false,
          walletList: [
            'core_wallet',
            'detected_ethereum_wallets',
            'metamask',
            'coinbase_wallet',
            'rainbow',
            'wallet_connect',
          ],
        },
        loginMethods: ['email', 'wallet'],
        defaultChain: avalanche,
        supportedChains: [avalanche, avalancheFuji],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
