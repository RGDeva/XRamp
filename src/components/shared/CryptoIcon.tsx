import { cn } from '@/lib/utils';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

const ICON_URLS: Record<string, string> = {
  eth:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  sol:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  avax: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  base: 'https://assets.coingecko.com/coins/images/33613/small/base.png',
  arb:  'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  usdc: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  btc:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  bnb:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  matic:'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  link: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
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

export const TOKENS = [
  { symbol: 'AVAX', name: 'Avalanche', network: 'Avalanche C-Chain' },
  { symbol: 'ETH',  name: 'Ethereum',  network: 'Ethereum / Base' },
  { symbol: 'SOL',  name: 'Solana',    network: 'Solana' },
  { symbol: 'BASE', name: 'Base ETH',  network: 'Base' },
  { symbol: 'ARB',  name: 'Arbitrum',  network: 'Arbitrum One' },
  { symbol: 'USDC', name: 'USD Coin',  network: 'Multi-chain' },
];
