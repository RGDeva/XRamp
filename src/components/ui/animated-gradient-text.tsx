import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "animate-gradient bg-gradient-to-r from-[hsl(185_80%_55%)] via-[hsl(195_85%_65%)] to-[hsl(175_75%_50%)] bg-[length:200%_auto] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
