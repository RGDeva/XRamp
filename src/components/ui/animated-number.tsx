import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export function AnimatedNumber({
  value,
  className,
  prefix = "",
  suffix = "",
  decimalPlaces = 2,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    startRef.current = null;

    const duration = 900;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setDisplay(to);
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {display.toFixed(decimalPlaces)}
      {suffix}
    </span>
  );
}
