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
          label: 'Privacy mode',
          description: 'Hide balances on screen',
          action: (
            <Switch
              checked={privacyMode}
              onCheckedChange={togglePrivacyMode}
            />
          ),
        },
        {
          icon: DollarSign,
          label: 'Currency',
          description: 'Default fiat currency',
          action: (
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-20 h-8 text-sm">
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
          description: 'Affects payment options',
          action: (
            <Select defaultValue="us">
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="uk">UK</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          icon: LifeBuoy,
          label: 'Help Center',
          action: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          onClick: () => {},
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          action: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          onClick: () => {},
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          action: <ChevronRight className="h-4 w-4 text-muted-foreground" />,
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        {settingGroups.map((group, groupIndex) => (
          <div key={group.title} className="animate-fade-in" style={{ animationDelay: `${groupIndex * 100}ms` }}>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {group.title}
            </h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={item.onClick}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
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
      <div className="mt-12 text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
        <p className="font-medium text-foreground text-sm mb-1">XRamp</p>
        <p>Private. Fast. Simple.</p>
        <p className="mt-1">v1.0.0</p>
      </div>
    </div>
  );
}
