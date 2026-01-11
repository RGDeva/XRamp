import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background noise-texture">
      {/* Proof grid overlay */}
      <div className="proof-grid fixed inset-0 pointer-events-none" />
      
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header />
        <main className="relative min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
