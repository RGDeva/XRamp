import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';
import { CommandMode } from '@/components/command/CommandMode';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Stars background — fixed, full-screen, behind everything */}
      <StarsBackground
        starColor="#ffffff"
        className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_#0d1117_0%,_#000_100%)]"
        pointerEvents={false}
      />

      {/* Subtle cyan gradient overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      </div>

      <TopNav />

      <main className="relative z-10 pt-16 pb-20 md:pb-8 min-h-screen">
        {children}
      </main>

      <BottomNav />
      <CommandMode />
    </div>
  );
}
