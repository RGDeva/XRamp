import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  decimalPlaces?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function NumberTicker({
  value,
  decimalPlaces = 2,
  className,
  prefix = "",
  suffix = "",
  duration = 1200,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = startValueRef.current;
    const to = value;
    startRef.current = null;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      el.textContent = prefix + current.toFixed(decimalPlaces) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else {
        el.textContent = prefix + to.toFixed(decimalPlaces) + suffix;
        startValueRef.current = to;
      }
    };

    requestAnimationFrame(step);
  }, [value, decimalPlaces, prefix, suffix, duration]);

  return (
    <span
      ref={ref}
      className={cn("tabular-nums", className)}
    >
      {prefix}
      {value.toFixed(decimalPlaces)}
      {suffix}
    </span>
  );
}
