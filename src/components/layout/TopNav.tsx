import { NavLink, useLocation } from 'react-router-dom';
import KineticDotsLoader from '@/components/ui/kinetic-dots-loader';
import { Eye, EyeOff, ChevronDown, User, Shield, LogOut, Home, ArrowDownToLine, ArrowUpFromLine, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TubelightNavBar } from '@/components/ui/tubelight-navbar';
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

const desktopNavItems = [
  { name: 'Home',     url: '/',         icon: Home,             exact: true },
  { name: 'Ramp',     url: '/ramp',     icon: ArrowDownToLine },
  { name: 'Deposits', url: '/deposits', icon: ArrowUpFromLine },
  { name: 'Activity', url: '/activity', icon: Activity },
];

export function TopNav() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const { privacyMode, togglePrivacyMode, toggleRampPanel, rampPanelOpen } = useApp();
  const isRamp = location.pathname === '/ramp';

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

          {/* Center nav — tubelight */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <TubelightNavBar items={desktopNavItems} />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Profile panel toggle — only on /ramp */}
            {isRamp && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleRampPanel}
                    className={cn('h-9 w-9 rounded-full border border-border', rampPanelOpen && 'bg-primary/10 border-primary text-primary')}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-sm">Account panel</p></TooltipContent>
              </Tooltip>
            )}
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
              <div className="h-9 flex items-center px-2">
                <KineticDotsLoader dots={3} className="p-0" />
              </div>
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
