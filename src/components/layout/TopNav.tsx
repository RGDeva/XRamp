import { NavLink, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ChevronDown, User, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, truncateAddress, getDeliveryAddress } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import xrampLogoIcon from '@/assets/xramp-logo-icon.png';

export function TopNav() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const { privacyMode, togglePrivacyMode } = useApp();

  const navLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/buy', label: 'Buy' },
    { path: '/sell', label: 'Sell' },
    { path: '/activity', label: 'Activity' },
  ];

  const isActiveLink = (link: typeof navLinks[0]) => {
    if (link.exact) {
      return location.pathname === link.path;
    }
    return location.pathname.startsWith(link.path);
  };

  const deliveryAddress = getDeliveryAddress(user);
  const displayIdentifier = user?.email || (deliveryAddress ? truncateAddress(deliveryAddress) : null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <img 
              src={xrampLogoIcon} 
              alt="XRamp" 
              className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-lg font-semibold text-foreground hidden sm:block">XRamp</span>
          </NavLink>

          {/* Center nav */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-xl">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
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
                  {privacyMode ? 'Privacy mode on' : 'Hides amounts on screen only.'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Auth */}
            {isLoading ? (
              <Button size="sm" variant="outline" disabled className="h-9">
                <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              </Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {displayIdentifier || 'Account'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={login} className="h-9">
                Log in
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
