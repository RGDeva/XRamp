import { useApp } from '@/contexts/AppContext';
import { WalletHero } from '@/components/home/WalletHero';
import { BalanceCard } from '@/components/home/BalanceCard';
import { RecentActivity } from '@/components/home/RecentActivity';

export default function Home() {
  const { wallet } = useApp();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      {wallet.isConnected ? (
        <div className="w-full">
          <BalanceCard />
          <RecentActivity />
        </div>
      ) : (
        <WalletHero />
      )}
    </div>
  );
}
