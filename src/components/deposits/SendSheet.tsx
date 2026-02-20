import { useState } from 'react';
import { X, Copy, Check, MessageCircle, Mail, Smartphone, ExternalLink } from 'lucide-react';
import { RailIcon } from '@/components/shared/RailIcon';
import { cn } from '@/lib/utils';

interface SendSheetProps {
  open: boolean;
  onClose: () => void;
  depositId: number;
  amount: string;
  token: string;
  railId: string;
  railName: string;
  handle: string;
}

export function SendSheet({ open, onClose, depositId, amount, token, railId, railName, handle }: SendSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const depositUrl = `${window.location.origin}/deposits/${depositId}`;
  const message = `I'm selling ${amount} ${token} for fiat via XRamp.\nPay me on ${railName}: ${handle}\nDeposit: ${depositUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = depositUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`XRamp Deposit — ${amount} ${token}`)}&body=${encodeURIComponent(message)}`;

  const actions = [
    {
      label: 'WhatsApp',
      sublabel: 'Send via WhatsApp',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#25D366"/>
          <path d="M12 4.5C7.86 4.5 4.5 7.86 4.5 12c0 1.34.35 2.6.96 3.7L4.5 19.5l3.93-.94A7.46 7.46 0 0012 19.5c4.14 0 7.5-3.36 7.5-7.5S16.14 4.5 12 4.5zm3.67 10.27c-.16.44-1.57.86-1.95.9-.38.04-.74.18-2.5-.52-2.1-.84-3.43-2.97-3.53-3.1-.1-.14-.83-1.1-.83-2.1s.52-1.48.71-1.69c.19-.2.42-.25.56-.25h.4c.13 0 .31-.05.48.37.17.42.58 1.42.63 1.52.05.1.08.22.02.35-.07.13-.1.21-.2.32-.1.11-.21.25-.3.33-.1.1-.2.2-.09.4.12.2.52.86 1.12 1.4.77.69 1.42.9 1.62 1 .2.1.32.08.44-.05.12-.13.5-.58.63-.78.13-.2.26-.17.44-.1.18.07 1.14.54 1.34.64.2.1.33.14.38.22.05.08.05.46-.11.9z" fill="white"/>
        </svg>
      ),
      href: whatsappUrl,
      color: 'hover:bg-green-500/10',
    },
    {
      label: 'SMS',
      sublabel: 'Send a text message',
      icon: (
        <div className="h-6 w-6 rounded-md bg-blue-500 flex items-center justify-center">
          <Smartphone className="h-3.5 w-3.5 text-white" />
        </div>
      ),
      href: smsUrl,
      color: 'hover:bg-blue-500/10',
    },
    {
      label: 'Email',
      sublabel: 'Send via email',
      icon: (
        <div className="h-6 w-6 rounded-md bg-orange-500 flex items-center justify-center">
          <Mail className="h-3.5 w-3.5 text-white" />
        </div>
      ),
      href: emailUrl,
      color: 'hover:bg-orange-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl z-10">

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Send deposit link</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Share your {amount} {token} deposit</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Deposit summary pill */}
          <div className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-[#2775CA] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">$</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{amount} {token} deposit #{depositId}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RailIcon rail={railId} size={14} />
                <span className="text-xs text-muted-foreground">{railName} · {handle}</span>
              </div>
            </div>
          </div>

          {/* Copy link row */}
          <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-4 py-3">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-xs text-muted-foreground truncate font-mono">{depositUrl}</span>
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0',
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Share actions */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Send via</p>
            {actions.map(action => (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                  action.color
                )}
              >
                <span className="flex-shrink-0">{action.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.sublabel}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>

          {/* Message preview */}
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1.5 px-1">
              <MessageCircle className="h-3.5 w-3.5" />
              Preview message
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl px-4 py-3 whitespace-pre-wrap font-sans leading-relaxed">
              {message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
