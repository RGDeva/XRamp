import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children: React.ReactNode;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "hsl(185 80% 70%)",
      shimmerSize = "0.1em",
      shimmerDuration = "2.5s",
      borderRadius = "0.75rem",
      background = "hsl(var(--primary))",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-8 py-4 text-white [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:scale-[0.98] hover:scale-[1.02]",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* shimmer layer */}
        <div
          className={cn(
            "absolute inset-0 overflow-visible [container-type:size]",
          )}
        >
          <div className="absolute inset-0 h-full w-full animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" style={{ "--spread": "90deg" } as React.CSSProperties} />
          </div>
        </div>
        {children}
        {/* inner highlight */}
        <div
          className="absolute inset-[var(--cut)] rounded-[calc(var(--radius)-var(--cut))] [background:var(--bg)]"
        />
        <span className="relative z-10">{/* children rendered above */}</span>
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";

export { ShimmerButton };
