import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#d4a948] via-[#b8860b] to-[#d4a948] text-[#030305] font-semibold shadow-[0_4px_20px_rgba(212,169,72,0.25),inset_0_1px_0_rgba(245,212,133,0.3)] hover:shadow-[0_8px_30px_rgba(212,169,72,0.4),inset_0_1px_0_rgba(245,212,133,0.4)] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white shadow-[0_4px_15px_rgba(185,28,28,0.3)] hover:shadow-[0_8px_25px_rgba(185,28,28,0.4)] hover:-translate-y-0.5 focus-visible:ring-destructive/50",
        outline:
          "border border-[rgba(212,169,72,0.3)] bg-transparent text-[#d4a948] hover:bg-[rgba(212,169,72,0.1)] hover:border-[rgba(212,169,72,0.5)] hover:shadow-[0_0_20px_rgba(212,169,72,0.15)]",
        secondary:
          "bg-gradient-to-r from-[#18181b] to-[#0a0a0c] text-[#d4a948] border border-[rgba(212,169,72,0.2)] shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:border-[rgba(212,169,72,0.4)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_20px_rgba(212,169,72,0.1)] hover:-translate-y-0.5",
        ghost:
          "text-[#a1a1aa] hover:text-[#d4a948] hover:bg-[rgba(212,169,72,0.08)]",
        link: "text-[#d4a948] underline-offset-4 hover:underline hover:text-[#f5d485]",
        premium:
          "relative overflow-hidden bg-gradient-to-r from-[#d4a948] via-[#b8860b] to-[#8b7355] text-[#030305] font-semibold shadow-[0_4px_20px_rgba(212,169,72,0.25),inset_0_2px_0_rgba(245,212,133,0.3),inset_0_-1px_0_rgba(139,115,85,0.3)] hover:shadow-[0_8px_30px_rgba(212,169,72,0.4),inset_0_2px_0_rgba(245,212,133,0.4)] hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
        "premium-outline":
          "border-[1.5px] border-[rgba(212,169,72,0.4)] bg-transparent text-[#d4a948] font-semibold hover:bg-[rgba(212,169,72,0.1)] hover:border-[rgba(212,169,72,0.6)] hover:shadow-[0_8px_25px_rgba(212,169,72,0.15)] hover:-translate-y-0.5",
        glass:
          "bg-[rgba(212,169,72,0.05)] backdrop-blur-xl border border-[rgba(212,169,72,0.15)] text-[#fafaf9] hover:bg-[rgba(212,169,72,0.12)] hover:border-[rgba(212,169,72,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5",
        dark: "bg-gradient-to-br from-[#18181b] to-[#0a0a0c] text-[#d4a948] border border-[rgba(212,169,72,0.15)] shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:border-[rgba(212,169,72,0.3)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_15px_rgba(212,169,72,0.08)] hover:-translate-y-0.5",
        success:
          "bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white shadow-[0_4px_15px_rgba(22,163,74,0.3)] hover:shadow-[0_8px_25px_rgba(22,163,74,0.4)] hover:-translate-y-0.5",
        warning:
          "bg-gradient-to-r from-[#d4a948] to-[#b8860b] text-[#030305] shadow-[0_4px_15px_rgba(212,169,72,0.3)] hover:shadow-[0_8px_25px_rgba(212,169,72,0.4)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md gap-1.5 px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
