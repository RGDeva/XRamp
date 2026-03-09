import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wallet, History, LayoutList, Send as SendIcon, Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '@/contexts/AppContext';
import { useAuth, getDeliveryAddress } from '@/contexts/AuthContext';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { RailIcon } from '@/components/shared/RailIcon';
import { TrustwareDepositWidget } from '@/components/shared/TrustwareDepositWidget';
import { getUsdcBalance } from '@/lib/fuji';
import { cn } from '@/lib/utils';

type FundingTab = 'SWAP' | 'DIRECT' | 'BRIDGE';

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function WalletSidebar() {
  const navigate = useNavigate();
  const { rampPanelOpen: panelOpen, setRampPanelOpen: setPanelOpen } = useApp();
  const { isAuthenticated, user } = useAuth();
  const [sidebarBalance, setSidebarBalance] = useState<string>('—');
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [fundingTab, setFundingTab] = useState<FundingTab>('SWAP');

  const deliveryAddress = getDeliveryAddress(user ? {
    email: user?.email || undefined,
    walletAddress: user?.walletAddress || undefined,
    embeddedWalletAddress: user?.embeddedWalletAddress || undefined,
  } : null);

  useEffect(() => {
    if (!deliveryAddress) { setSidebarBalance('—'); return; }
    getUsdcBalance(deliveryAddress)
      .then(({ formatted }) => setSidebarBalance(parseFloat(formatted).toFixed(2)))
      .catch(() => setSidebarBalance('0.00'));
  }, [deliveryAddress]);

  if (!isAuthenticated) return null;

  return (
    <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] z-30 flex flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-elevated transition-all duration-300 ease-in-out ${panelOpen ? 'w-80 translate-x-0' : 'w-80 translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Account</span>
        <button onClick={() => setPanelOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Wallet Balance */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Wallet Balance</div>
          <div className="bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">XRamp Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <CryptoIcon symbol="USDC" size={24} />
              <span className="text-2xl font-bold text-foreground">{sidebarBalance}</span>
              <span className="text-muted-foreground font-medium">USDC</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setAddFundsOpen(o => !o)}
                className={cn(
                  'flex-1 text-xs border rounded-lg py-2 transition-colors font-medium',
                  addFundsOpen
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'text-primary border-primary/30 hover:bg-primary/10',
                )}
              >
                + Add Funds
              </button>
              <button className="flex-1 text-xs text-muted-foreground border border-border rounded-lg py-2 hover:bg-secondary transition-colors font-medium">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Add Funds Module — collapsible */}
        {addFundsOpen && (
          <div className="bg-secondary border border-border rounded-xl overflow-hidden animate-fade-in">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['SWAP', 'DIRECT', 'BRIDGE'] as FundingTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setFundingTab(t)}
                  className={cn(
                    'flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                    fundingTab === t
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {fundingTab === 'SWAP' && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-xs text-muted-foreground">
                    Buy crypto directly using Venmo, Cash App, Zelle and other P2P rails.
                  </p>
                  <button
                    onClick={() => { navigate('/ramp?tab=Buy'); setPanelOpen(false); }}
                    className="w-full py-2.5 text-xs font-semibold text-foreground bg-primary/10 border border-primary/30 rounded-xl hover:bg-primary/20 transition-colors"
                  >
                    BUY CRYPTO
                  </button>
                </div>
              )}

              {fundingTab === 'DIRECT' && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-xs text-muted-foreground">
                    Send supported tokens directly to your XRamp wallet.
                  </p>
                  {deliveryAddress ? (
                    <>
                      <div className="flex justify-center py-2">
                        <div className="bg-white rounded-xl p-2">
                          <QRCodeSVG value={deliveryAddress} size={120} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-card border border-border rounded-lg px-3 py-2">
                        <span className="font-mono text-[10px] text-foreground truncate">{deliveryAddress}</span>
                        <CopyBtn value={deliveryAddress} />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Avalanche C-Chain · USDC, AVAX, USDT
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No wallet address available.
                    </p>
                  )}
                </div>
              )}

              {fundingTab === 'BRIDGE' && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <p className="text-xs font-medium text-foreground">Bridge crypto from other chains</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Powered by Trustware</p>
                  </div>
                  <TrustwareDepositWidget />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Deposits */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Active Deposits</div>
          <div className="space-y-2">
            {[
              { id: 2428, token: 'USDC', taken: '6.69', rail: 'venmo' },
              { id: 2441, token: 'USDC', taken: '18.69', rail: 'cashapp' },
            ].map(dep => (
              <button
                key={dep.id}
                onClick={() => { navigate('/deposits'); setPanelOpen(false); }}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-secondary/80 transition-colors"
              >
                <CryptoIcon symbol={dep.token} size={28} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-foreground">#{dep.id}</div>
                  <div className="text-xs text-muted-foreground">${dep.taken} taken</div>
                </div>
                <RailIcon rail={dep.rail} size={20} />
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-border pt-4 space-y-1">
          {([
            { icon: SendIcon,   label: 'Send',          action: () => { navigate('/ramp?tab=Send'); setPanelOpen(false); } },
            { icon: History,    label: 'Order History',  action: () => { navigate('/activity'); setPanelOpen(false); } },
            { icon: LayoutList, label: 'My Deposits',    action: () => { navigate('/deposits'); setPanelOpen(false); } },
          ] as const).map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left">
              <Icon className="h-4 w-4 flex-shrink-0" />{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
