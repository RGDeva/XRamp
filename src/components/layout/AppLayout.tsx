import { ReactNode, useEffect } from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { WalletSidebar } from './WalletSidebar';
import { useApp } from '@/contexts/AppContext';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';
import { CommandMode } from '@/components/command/CommandMode';
import { useAuth } from '@/contexts/AuthContext';
import { orchestratorApi } from '@/lib/orchestratorApi';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['rishmanx@gmail.com'];
const ADMIN_WALLETS = ['0x01141553f506df71cb71751a30526f00269179ac'];
const ADMIN_SUBS = ['did:privy:cmm2yw6n800460cl5cnozhi7j'];

function useProofMessageListener() {
  const { user } = useAuth();
  const userEmail = user?.email || null;
  const userWallet = user?.walletAddress?.toLowerCase() || user?.embeddedWalletAddress?.toLowerCase() || null;
  const isAdmin = (userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false)
    || (userWallet ? ADMIN_WALLETS.includes(userWallet) : false)
    || (user?.privySub ? ADMIN_SUBS.includes(user.privySub) : false);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type !== 'XRAMP_PROOF_RESULT') return;
      const payload = event.data.payload;
      if (!payload?.intentId) return;

      const { intentId, providerId, proofHash, proofPayload, verified } = payload;

      try {
        await orchestratorApi.submitProof(intentId, {
          providerId: providerId ?? 'venmo',
          proofHash,
          payload: proofPayload,
        });

        if (verified && isAdmin) {
          await orchestratorApi.verifyAndRelease(intentId);
          toast.success('Proof verified — escrow released!', {
            description: `Intent ${intentId.slice(0, 8)}… is now COMPLETE`,
          });
        } else if (verified) {
          toast.success('Payment proof submitted', {
            description: 'Awaiting admin release. Check Activity for updates.',
          });
        } else {
          toast.error('Proof submission recorded', {
            description: payload.reason ?? 'Verification returned false.',
          });
        }
      } catch {
        // Non-fatal — proof may already exist
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isAdmin]);
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useProofMessageListener();
  const { rampPanelOpen } = useApp();

  return (
    <div className="min-h-screen">
      {/* Stars background — fixed, full-screen, behind everything */}
      <StarsBackground
        starColor="#ffffff"
        className="!fixed !inset-0 !w-screen !h-screen z-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_#0d1117_0%,_#000_100%)]"
        pointerEvents={false}
      />

      {/* Subtle cyan gradient overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      </div>

      <TopNav />
      <WalletSidebar />

      <main className={`relative z-10 pt-16 pb-20 md:pb-8 min-h-screen transition-all duration-300 ${rampPanelOpen ? 'md:mr-80' : 'mr-0'}`}>
        {children}
      </main>

      <BottomNav />
      <CommandMode />
    </div>
  );
}
