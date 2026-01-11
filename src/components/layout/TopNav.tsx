import { NavLink, useLocation } from 'react-router-dom';
import { Activity, Settings, Wallet, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TopNav() {
  const location = useLocation();
  const { wallet, connectWallet, disconnectWallet, privacyMode, togglePrivacyMode } = useApp();

  const navLinks = [
    { path: '/', label: 'Buy' },
    { path: '/sell', label: 'Sell' },
  ];

  const secondaryLinks = [
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
              <span className="text-base font-bold text-primary-foreground">X</span>
            </div>
            <span className="text-lg font-semibold text-foreground hidden sm:block">XRamp</span>
          </NavLink>

          {/* Center nav - Buy/Sell */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-secondary/50 p-1 rounded-xl">
            {navLinks.map((link) => {
              const isActive = link.path === '/' 
                ? location.pathname === '/' || location.pathname.startsWith('/buy')
                : location.pathname.startsWith(link.path);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Secondary nav links - desktop only */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              {secondaryLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                  </NavLink>
                );
              })}
            </div>

            {/* Privacy Mode */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePrivacyMode}
                  className={cn('h-9 w-9', privacyMode && 'text-primary')}
                >
                  {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {privacyMode ? 'Privacy mode on' : 'Privacy mode off'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Wallet */}
            {wallet.isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
                className="font-mono text-xs h-9 gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-success" />
                {wallet.address}
              </Button>
            ) : (
              <Button size="sm" onClick={connectWallet} className="h-9 gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
