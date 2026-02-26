import { cn } from '@/lib/utils';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

const ICON_URLS: Record<string, string> = {
  eth:   'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  weth:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  sol:   'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  avax:  'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  wavax: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  base:  'https://assets.coingecko.com/coins/images/33613/small/base.png',
  arb:   'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  usdc:  'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  usdt:  'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  btc:   'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  'btc.b':'https://assets.coingecko.com/coins/images/26115/small/btcb.png',
  btcb:  'https://assets.coingecko.com/coins/images/26115/small/btcb.png',
  bnb:   'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  matic: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  link:  'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  joe:   'https://assets.coingecko.com/coins/images/17569/small/joe_200x200.png',
  gmx:   'https://assets.coingecko.com/coins/images/18323/small/arbit.png',
  aave:  'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  uni:   'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  op:    'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
};

const FALLBACK_COLORS: Record<string, string> = {
  btc: '#F7931A', bnb: '#F3BA2F', matic: '#8247E5', link: '#2A5ADA',
};

export function CryptoIcon({ symbol, size = 32, className }: CryptoIconProps) {
  const key = symbol.toLowerCase();
  const url = ICON_URLS[key];

  if (url) {
    return (
      <img
        src={url}
        alt={symbol}
        width={size}
        height={size}
        className={cn('rounded-full object-cover flex-shrink-0', className)}
        style={{ width: size, height: size }}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = 'none';
          const next = target.nextElementSibling as HTMLElement | null;
          if (next) next.style.display = 'flex';
        }}
      />
    );
  }

  const bg = FALLBACK_COLORS[key] ?? '#6B7280';
  return (
    <div
      className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', className)}
      style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: bg }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

export interface Token {
  symbol: string;
  name: string;
  network: string;
  chain: 'avalanche' | 'ethereum' | 'base' | 'solana' | 'arbitrum' | 'other';
  address?: string;
}

// Avalanche-native tokens listed first
export const TOKENS: Token[] = [
  { symbol: 'AVAX',   name: 'Avalanche',          network: 'Avalanche C-Chain', chain: 'avalanche' },
  { symbol: 'USDC',   name: 'USD Coin',            network: 'Avalanche C-Chain', chain: 'avalanche', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
  { symbol: 'USDT',   name: 'Tether',              network: 'Avalanche C-Chain', chain: 'avalanche', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' },
  { symbol: 'BTC.b',  name: 'Bitcoin (Avalanche)', network: 'Avalanche C-Chain', chain: 'avalanche', address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50' },
  { symbol: 'WETH',   name: 'Wrapped Ether',       network: 'Avalanche C-Chain', chain: 'avalanche', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB' },
  { symbol: 'WAVAX',  name: 'Wrapped AVAX',        network: 'Avalanche C-Chain', chain: 'avalanche' },
  { symbol: 'JOE',    name: 'Trader Joe',          network: 'Avalanche C-Chain', chain: 'avalanche' },
  { symbol: 'LINK',   name: 'Chainlink',           network: 'Avalanche C-Chain', chain: 'avalanche' },
  { symbol: 'AAVE',   name: 'Aave',                network: 'Avalanche C-Chain', chain: 'avalanche' },
  { symbol: 'GMX',    name: 'GMX',                 network: 'Avalanche C-Chain', chain: 'avalanche' },
  { symbol: 'ETH',    name: 'Ethereum',            network: 'Ethereum',          chain: 'ethereum' },
  { symbol: 'BASE',   name: 'Base ETH',            network: 'Base',              chain: 'base' },
  { symbol: 'ARB',    name: 'Arbitrum',            network: 'Arbitrum One',      chain: 'arbitrum' },
  { symbol: 'SOL',    name: 'Solana',              network: 'Solana',            chain: 'solana' },
  { symbol: 'BTC',    name: 'Bitcoin',             network: 'Bitcoin',           chain: 'other' },
];
