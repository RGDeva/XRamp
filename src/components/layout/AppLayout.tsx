import { ReactNode, useEffect } from 'react';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { WalletSidebar } from './WalletSidebar';
import { useApp } from '@/contexts/AppContext';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';
import { CommandMode } from '@/components/command/CommandMode';
import { orchestratorApi } from '@/lib/orchestratorApi';
import { toast } from 'sonner';

function useProofMessageListener() {

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // Only accept messages posted by this page itself (e.g. our extension's content script)
      if (event.source !== window || event.origin !== window.location.origin) return;
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

        // Release is never triggered automatically from a window message;
        // an admin must review and verify it explicitly.
        if (verified) {
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
  }, []);
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
