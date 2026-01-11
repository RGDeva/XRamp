import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuoteBreakdownProps {
  rate: string;
  networkFee: string;
  xrampFee: string;
  total: string;
  rateLockExpiry: number; // seconds
}

export function QuoteBreakdown({
  rate,
  networkFee,
  xrampFee,
  total,
  rateLockExpiry,
}: QuoteBreakdownProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="breakdown" className="border-border">
        <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground py-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            View breakdown
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium font-mono">{rate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network fee</span>
              <span className="font-medium font-mono">{networkFee}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">XRamp fee</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">XRamp service fee</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium font-mono">{xrampFee}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-semibold font-mono text-lg">{total}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Rate locks in</span>
              </div>
              <span className="font-mono text-primary font-medium">
                {formatTime(rateLockExpiry)}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
