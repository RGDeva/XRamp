import { Home, ArrowDownToLine, ArrowUpFromLine, Activity } from 'lucide-react';
import { TubelightNavBar } from '@/components/ui/tubelight-navbar';

const mobileNavItems = [
  { name: 'Home',     url: '/',         icon: Home,             exact: true },
  { name: 'Ramp',     url: '/ramp',     icon: ArrowDownToLine },
  { name: 'Deposits', url: '/deposits', icon: ArrowUpFromLine },
  { name: 'Activity', url: '/activity', icon: Activity },
];

export function BottomNav() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-5 md:hidden">
      <TubelightNavBar
        items={mobileNavItems}
        className="bg-background/80 border border-border backdrop-blur-xl shadow-elevated rounded-full px-2 py-1.5"
      />
    </div>
  );
}
