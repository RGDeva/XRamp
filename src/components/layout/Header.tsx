import { Wallet, Eye, EyeOff, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ArrowDownToLine, ArrowUpFromLine, Activity, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/buy', icon: ArrowDownToLine, label: 'Buy' },
  { path: '/sell', icon: ArrowUpFromLine, label: 'Sell' },
  { path: '/activity', icon: Activity, label: 'Activity' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Header() {
  const { wallet, connectWallet, disconnectWallet, privacyMode, togglePrivacyMode } = useApp();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile menu */}
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">X</span>
                </div>
                <span className="text-xl font-semibold text-foreground">XRamp</span>
              </div>
              <nav className="space-y-1 p-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-accent text-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">X</span>
            </div>
            <span className="text-lg font-semibold">XRamp</span>
          </div>
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block" />

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Privacy Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePrivacyMode}
                className={cn(privacyMode && 'text-primary')}
              >
                {privacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                {privacyMode ? 'Privacy mode on' : 'Privacy mode off'}
              </p>
              <p className="text-xs text-muted-foreground">
                Hides amounts on screen. Does not affect transactions.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Wallet Connection */}
          {wallet.isConnected ? (
            <Button
              variant="wallet"
              onClick={disconnectWallet}
              className="font-mono text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-success" />
              {wallet.address}
            </Button>
          ) : (
            <Button variant="default" onClick={connectWallet}>
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
