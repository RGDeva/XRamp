import { BalanceCard } from '@/components/home/BalanceCard';
import { ActionButtons } from '@/components/home/ActionButtons';
import { RecentActivity } from '@/components/home/RecentActivity';

const Index = () => {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
      <BalanceCard />
      <ActionButtons />
      <RecentActivity />
    </div>
  );
};

export default Index;
