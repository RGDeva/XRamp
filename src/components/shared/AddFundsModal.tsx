import { X, Layers } from 'lucide-react';
import { TrustwareDepositWidget } from '@/components/shared/TrustwareDepositWidget';

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddFundsModal({ open, onClose }: AddFundsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl z-10 max-h-[85vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Bridge Crypto into XRamp</h2>
              <p className="text-xs text-muted-foreground">Powered by Trustware</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Select any token from any supported chain — Trustware routes and converts it to AVAX on Avalanche automatically.
          </p>
          <TrustwareDepositWidget />
        </div>
      </div>
    </div>
  );
}
