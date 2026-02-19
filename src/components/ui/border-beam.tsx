import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  colorFrom = "hsl(185 80% 50%)",
  colorTo = "hsl(195 85% 65%)",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--size)*0.01px)_solid_transparent]",
        "[background:linear-gradient(var(--bg,hsl(var(--card))),var(--bg,hsl(var(--card))))_padding-box,linear-gradient(calc(var(--angle)*1deg),var(--color-from),var(--color-to),transparent)_border-box]",
        "[animation:border-beam_calc(var(--duration)*1s)_var(--delay)_linear_infinite]",
        className,
      )}
    />
  );
}
