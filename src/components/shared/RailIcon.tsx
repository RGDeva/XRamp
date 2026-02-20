import { cn } from '@/lib/utils';

interface RailIconProps {
  rail: string;
  size?: number;
  className?: string;
}

function VenmoSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#3D95CE"/>
      <path d="M35 12.5c.7 1.2 1 2.6 1 4.2 0 5.2-4.4 11.9-8 16.5H19.3L16 13.5l7.2-.7 1.7 14.1c1.6-2.7 3.6-7 3.6-9.8 0-1.6-.3-2.7-.7-3.6L35 12.5z" fill="white"/>
    </svg>
  );
}

function CashAppSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#00D64F"/>
      <path d="M25.8 14.4l.7-3.4h-3.1l-.7 3.4c-3.5.6-5.7 2.7-5.7 5.6 0 2.7 1.7 4.1 5 5l1 .3c2.1.6 2.9 1.1 2.9 2.1 0 1.1-1.1 1.9-2.9 1.9-1.8 0-3.5-.8-4.8-2l-2 2.5c1.5 1.4 3.5 2.2 5.6 2.5l-.7 3.4h3.1l.7-3.4c3.6-.6 5.9-2.7 5.9-5.7 0-2.8-1.7-4.2-5.2-5.2l-1-.3c-1.9-.5-2.7-1-2.7-1.9 0-.9 1-1.7 2.5-1.7 1.6 0 3.1.6 4.3 1.6l1.9-2.5c-1.4-1.2-3.1-1.9-4.8-2.2z" fill="white"/>
    </svg>
  );
}

function ZelleSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#6D1ED4"/>
      <path d="M31 12H17.4l-.4 3h9L14 33h14.6l.4-3h-9.5L31 12z" fill="white"/>
    </svg>
  );
}

function RevolutSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#191C1F"/>
      <path d="M16 11h11c4.4 0 7.5 2.9 7.5 7 0 3-1.7 5.4-4.3 6.5l4.8 9.5H30l-4.3-8.5H21v8.5h-5V11zm5 4v6.5h5.8c1.8 0 3.2-1.3 3.2-3.2 0-1.9-1.4-3.3-3.2-3.3H21z" fill="white"/>
    </svg>
  );
}

function WiseSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#9FE870"/>
      <path d="M24 10l4.5 11.5H38l-8.5 6.2 3.2 10.3L24 32l-8.7 6 3.2-10.3L10 21.5h9.5L24 10z" fill="#163300"/>
    </svg>
  );
}

function ChimeSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#1EC677"/>
      <path d="M24 10c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14-6.3-14-14-14zm0 4c5.5 0 10 4.5 10 10s-4.5 10-10 10S14 29.5 14 24s4.5-10 10-10zm-1 5v6h-4v2h4v4h2v-4h4v-2h-4v-6h-2z" fill="white"/>
    </svg>
  );
}

function PayPalSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#003087"/>
      <path d="M19.5 33.5l.6-3.8h-4.6l3.4-20.2h8.4c3.8 0 6.2 2 6.2 5.2 0 4.4-3.2 7-7.8 7h-3.2l-1 5.8h-2zm4.8-11.5c2.4 0 4-1.4 4-3.6 0-1.6-1-2.4-2.8-2.4h-3.6l-1.2 6h3.6z" fill="#009CDE"/>
      <path d="M16.5 35.5l.6-3.8h-4.6l3.4-20.2h8.4c3.8 0 6.2 2 6.2 5.2 0 4.4-3.2 7-7.8 7h-3.2l-1 5.8h-2zm4.8-11.5c2.4 0 4-1.4 4-3.6 0-1.6-1-2.4-2.8-2.4h-3.6l-1.2 6h3.6z" fill="white"/>
    </svg>
  );
}

const RAIL_MAP: Record<string, (size: number) => JSX.Element> = {
  venmo:   (s) => <VenmoSvg size={s} />,
  cashapp: (s) => <CashAppSvg size={s} />,
  'cash app': (s) => <CashAppSvg size={s} />,
  zelle:   (s) => <ZelleSvg size={s} />,
  revolut: (s) => <RevolutSvg size={s} />,
  wise:    (s) => <WiseSvg size={s} />,
  paypal:  (s) => <PayPalSvg size={s} />,
  chime:   (s) => <ChimeSvg size={s} />,
};

export function RailIcon({ rail, size = 24, className }: RailIconProps) {
  const key = rail.toLowerCase();
  const renderer = RAIL_MAP[key];
  if (!renderer) {
    return (
      <div
        className={cn('rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground', className)}
        style={{ width: size, height: size }}
      >
        {rail[0]?.toUpperCase()}
      </div>
    );
  }
  return <span className={cn('inline-flex flex-shrink-0', className)}>{renderer(size)}</span>;
}

export const RAILS = [
  { id: 'venmo',   name: 'Venmo',    tag: '@username',   placeholder: 'e.g. @john-doe' },
  { id: 'cashapp', name: 'Cash App', tag: '$cashtag',    placeholder: 'e.g. $johndoe' },
  { id: 'zelle',   name: 'Zelle',    tag: 'email/phone', placeholder: 'e.g. john@email.com' },
  { id: 'revolut', name: 'Revolut',  tag: '@revolut',    placeholder: 'e.g. @john' },
  { id: 'wise',    name: 'Wise',     tag: 'email',       placeholder: 'e.g. john@email.com' },
];
