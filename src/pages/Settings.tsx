import { useApp } from '@/contexts/AppContext';
import { Eye, EyeOff, DollarSign, Globe, LifeBuoy, FileText, Shield, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const { privacyMode, togglePrivacyMode, selectedCurrency, setSelectedCurrency } = useApp();

  const settingGroups = [
    {
      title: 'Preferences',
      items: [
        {
          icon: privacyMode ? EyeOff : Eye,
          label: 'Privacy mode default',
          description: 'Hide balances and amounts by default',
          action: (
            <Switch
              checked={privacyMode}
              onCheckedChange={togglePrivacyMode}
            />
          ),
        },
        {
          icon: DollarSign,
          label: 'Default currency',
          description: 'Your preferred fiat currency',
          action: (
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
        {
          icon: Globe,
          label: 'Region',
          description: 'Affects available payment rails',
          action: (
            <Select defaultValue="us">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: LifeBuoy,
          label: 'Help Center',
          description: 'Get help with your orders',
          action: <ChevronRight className="h-5 w-5 text-muted-foreground" />,
          onClick: () => {},
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: FileText,
          label: 'Terms of Service',
          description: 'Read our terms and conditions',
          action: <ChevronRight className="h-5 w-5 text-muted-foreground" />,
          onClick: () => {},
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          description: 'How we handle your data',
          action: <ChevronRight className="h-5 w-5 text-muted-foreground" />,
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-8">
        {settingGroups.map((group, groupIndex) => (
          <div key={group.title} className="animate-fade-in" style={{ animationDelay: `${groupIndex * 100}ms` }}>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              {group.title}
            </h2>
            <div className="xramp-card divide-y divide-border">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 first:pt-4 last:pb-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={item.onClick}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  {item.action}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
        <p className="font-medium text-foreground mb-1">XRamp</p>
        <p>Private. Fast. Simple.</p>
        <p className="mt-2">Version 1.0.0</p>
      </div>
    </div>
  );
}
