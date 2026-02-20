import { cn } from '@/lib/utils';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

function EthSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="24" fill="#627EEA"/>
      <path d="M24 8v12.87l10.87 4.86L24 8z" fill="white" fillOpacity="0.6"/>
      <path d="M24 8L13.13 25.73 24 20.87V8z" fill="white"/>
      <path d="M24 32.98v7.01L34.88 27.6 24 32.98z" fill="white" fillOpacity="0.6"/>
      <path d="M24 39.99v-7.02L13.13 27.6 24 39.99z" fill="white"/>
      <path d="M24 30.97l10.87-5.24L24 20.87v10.1z" fill="white" fillOpacity="0.2"/>
      <path d="M13.13 25.73L24 30.97V20.87L13.13 25.73z" fill="white" fillOpacity="0.6"/>
    </svg>
  );
}

function SolSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="24" fill="#9945FF"/>
      <path d="M13 31.5h17.5c.3 0 .5.1.7.3l2.5 2.7c.4.4.1 1-.5 1H15.7c-.3 0-.5-.1-.7-.3l-2.5-2.7c-.4-.4-.1-1 .5-1z" fill="url(#sol1)"/>
      <path d="M13 21h17.5c.3 0 .5.1.7.3l2.5 2.7c.4.4.1 1-.5 1H15.7c-.3 0-.5-.1-.7-.3l-2.5-2.7c-.4-.4-.1-1 .5-1z" fill="url(#sol2)"/>
      <path d="M13 12.5h17.5c.3 0 .5.1.7.3l2.5 2.7c.4.4.1 1-.5 1H15.7c-.3 0-.5-.1-.7-.3l-2.5-2.7c-.4-.4-.1-1 .5-1z" fill="url(#sol3)"/>
      <defs>
        <linearGradient id="sol1" x1="13" y1="35" x2="33" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
        </linearGradient>
        <linearGradient id="sol2" x1="13" y1="25" x2="33" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
        </linearGradient>
        <linearGradient id="sol3" x1="13" y1="16" x2="33" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function AvaxSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="24" fill="#E84142"/>
      <path d="M28.9 30.5H32c.7 0 1-.8.6-1.4L25 14.6c-.4-.6-1.2-.6-1.6 0l-2.2 3.8 5.5 9.5 2.2 2.6z" fill="white"/>
      <path d="M19.1 30.5H16c-.7 0-1-.8-.6-1.4l3.3-5.7 2.2 3.8-1.8 3.3z" fill="white" fillOpacity="0.8"/>
      <path d="M18.7 23.4l2.2-3.8 2.2 3.8-2.2 3.8-2.2-3.8z" fill="white"/>
    </svg>
  );
}

function BaseSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="24" fill="#0052FF"/>
      <path d="M24 10C16.27 10 10 16.27 10 24s6.27 14 14 14c7.38 0 13.43-5.73 13.96-12.97H21.03v-2.06h16.94C37.43 15.73 31.38 10 24 10z" fill="white"/>
    </svg>
  );
}

function ArbSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="24" fill="#213147"/>
      <path d="M24 9L11 16.5v15L24 39l13-7.5v-15L24 9z" fill="#12AAFF" fillOpacity="0.15"/>
      <path d="M20.5 28.5l-3.5 6 2.5 1.5 4-7-3-0.5z" fill="#12AAFF"/>
      <path d="M27.5 28.5l3.5 6-2.5 1.5-4-7 3-0.5z" fill="#9DCCED"/>
      <path d="M24 13l-8 14h4l4-7 4 7h4L24 13z" fill="white"/>
    </svg>
  );
}

function UsdcSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="24" fill="#2775CA"/>
      <path d="M24 10c-7.73 0-14 6.27-14 14s6.27 14 14 14 14-6.27 14-14-6.27-14-14-14zm1.5 22.5v1.5h-3v-1.5c-2.5-.5-4.5-2-4.5-4.5h2.5c0 1.5 1 2.5 2 2.5h2.5c1.5 0 2.5-1 2.5-2 0-1-.5-1.5-2.5-2l-2-.5c-2.5-.5-4-2-4-4 0-2.5 2-4 4.5-4.5V16h3v1.5c2.5.5 4 2 4 4.5h-2.5c0-1.5-1-2.5-2-2.5h-2c-1.5 0-2.5 1-2.5 2 0 1 .5 1.5 2 2l2 .5c3 .5 4.5 2 4.5 4 0 2.5-2 4-4.5 4.5z" fill="white"/>
    </svg>
  );
}

const CRYPTO_MAP: Record<string, (size: number) => JSX.Element> = {
  eth:  (s) => <EthSvg size={s} />,
  sol:  (s) => <SolSvg size={s} />,
  avax: (s) => <AvaxSvg size={s} />,
  base: (s) => <BaseSvg size={s} />,
  arb:  (s) => <ArbSvg size={s} />,
  usdc: (s) => <UsdcSvg size={s} />,
};

export function CryptoIcon({ symbol, size = 32, className }: CryptoIconProps) {
  const key = symbol.toLowerCase();
  const renderer = CRYPTO_MAP[key];
  if (!renderer) {
    const colors: Record<string, string> = {
      btc: '#F7931A', bnb: '#F3BA2F', matic: '#8247E5', link: '#2A5ADA',
    };
    const bg = colors[key] ?? '#6B7280';
    return (
      <div
        className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', className)}
        style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: bg }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <span className={cn('inline-flex flex-shrink-0', className)}>{renderer(size)}</span>;
}

export const TOKENS = [
  { symbol: 'AVAX', name: 'Avalanche',  network: 'Avalanche C-Chain' },
  { symbol: 'ETH',  name: 'Ethereum',   network: 'Ethereum / Base' },
  { symbol: 'SOL',  name: 'Solana',     network: 'Solana' },
  { symbol: 'BASE', name: 'Base ETH',   network: 'Base' },
  { symbol: 'ARB',  name: 'Arbitrum',   network: 'Arbitrum One' },
  { symbol: 'USDC', name: 'USD Coin',   network: 'Multi-chain' },
];
