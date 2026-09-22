import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500 text-black hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)]",
        destructive:
          "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30",
        outline:
          "border border-[#1a2333] bg-[#090d16]/80 text-[#f1f5f9] hover:bg-[#101624] hover:border-[#2a3850]",
        secondary:
          "bg-[#101624] text-[#f1f5f9] border border-[#1a2333] hover:bg-[#162035] hover:border-[#2a3850]",
        ghost:
          "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#101624]",
        link:
          "text-emerald-400 underline-offset-4 hover:underline",
        subtle:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40",
      },
      size: {
        default: "h-8 px-3.5 py-1.5",
        sm: "h-7 rounded px-2.5 text-[11px]",
        lg: "h-10 rounded-md px-5 text-sm",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
