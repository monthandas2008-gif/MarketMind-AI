import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border border-[#1a2333] bg-[#101624] text-[#94a3b8]",
        secondary:
          "border border-[#1a2333] bg-[#162035] text-[#cbd5e1]",
        bullish:
          "border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 font-semibold",
        bearish:
          "border border-rose-500/30 bg-rose-950/40 text-rose-400 font-semibold",
        neutral:
          "border border-amber-500/30 bg-amber-950/40 text-amber-400 font-semibold",
        ai:
          "border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-semibold",
        outline:
          "border border-[#2a3850] text-[#cbd5e1]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
