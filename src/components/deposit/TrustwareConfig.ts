// Trustware SDK configuration for XRamp
// USDC on Base (Chain ID: 8453)
export const BASE_CHAIN_ID = '8453';
export const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Placeholder merchant wallet for crypto payment mode
export const MERCHANT_WALLET_ADDRESS = '0x0000000000000000000000000000000000000001';

export type DepositMode = 'swap' | 'embedded' | 'payment';

export interface DepositModeConfig {
  id: DepositMode;
  label: string;
  description: string;
}

export const DEPOSIT_MODES: DepositModeConfig[] = [
  {
    id: 'swap',
    label: 'My Wallet',
    description: 'Swap/bridge to your connected wallet',
  },
  {
    id: 'embedded',
    label: 'XRamp Balance',
    description: 'Add to your XRamp embedded wallet',
  },
  {
    id: 'payment',
    label: 'Pay Merchant',
    description: 'Send crypto payment to a merchant',
  },
];

// XRamp theme for Trustware widget (matches TrustwareWidgetTheme type)
export const XRAMP_TRUSTWARE_THEME = {
  primaryColor: '#22d3ee', // cyan-400
  secondaryColor: '#0ea5e9', // sky-500
  backgroundColor: '#0a0c12', // dark background
  borderColor: '#1e293b', // subtle border
  textColor: '#f1f5f9', // near-white text
  radius: 16,
};

// Default widget messages
export const WIDGET_MESSAGES = {
  title: 'Top up',
  description: 'Deposit from any chain using any token.',
};

// Chain options for advanced settings
export const CHAIN_OPTIONS = [
  { id: '8453', name: 'Base', icon: '🔵' },
  { id: '1', name: 'Ethereum', icon: '⟠' },
  { id: '137', name: 'Polygon', icon: '🟣' },
  { id: '42161', name: 'Arbitrum', icon: '🔷' },
  { id: '10', name: 'Optimism', icon: '🔴' },
];

// Token options for advanced settings
export const TOKEN_OPTIONS = [
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin' },
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped ETH' },
  { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', symbol: 'DAI', name: 'Dai Stablecoin' },
];

// Placeholder function until embedded wallet is wired
export const getEmbeddedWalletAddress = (): string | null => {
  // TODO: Wire to actual embedded wallet address from Privy
  return null;
};
