import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-[#d4a948] to-[#b8860b] text-[#030305] shadow-[0_2px_8px_rgba(212,169,72,0.3)] [a&]:hover:shadow-[0_4px_12px_rgba(212,169,72,0.4)]",
        secondary:
          "border-[rgba(212,169,72,0.2)] bg-[rgba(212,169,72,0.08)] text-[#d4a948] [a&]:hover:bg-[rgba(212,169,72,0.15)] [a&]:hover:border-[rgba(212,169,72,0.3)]",
        destructive:
          "border-transparent bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white shadow-[0_2px_8px_rgba(185,28,28,0.3)] [a&]:hover:shadow-[0_4px_12px_rgba(185,28,28,0.4)]",
        outline:
          "border-[rgba(212,169,72,0.25)] bg-transparent text-[#d4a948] [a&]:hover:bg-[rgba(212,169,72,0.1)] [a&]:hover:border-[rgba(212,169,72,0.4)]",
        premium:
          "border-[rgba(245,212,133,0.3)] bg-gradient-to-r from-[rgba(212,169,72,0.15)] to-[rgba(184,134,11,0.1)] text-[#f5d485] shadow-[0_2px_12px_rgba(212,169,72,0.2),inset_0_1px_0_rgba(245,212,133,0.2)] [a&]:hover:shadow-[0_4px_16px_rgba(212,169,72,0.3)]",
        "premium-solid":
          "border-transparent bg-gradient-to-r from-[#f5d485] via-[#d4a948] to-[#b8860b] text-[#030305] shadow-[0_2px_10px_rgba(212,169,72,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] [a&]:hover:shadow-[0_4px_14px_rgba(212,169,72,0.45)]",
        success:
          "border-transparent bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white shadow-[0_2px_8px_rgba(22,163,74,0.3)] [a&]:hover:shadow-[0_4px_12px_rgba(22,163,74,0.4)]",
        "success-soft":
          "border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.1)] text-[#22c55e] [a&]:hover:bg-[rgba(22,163,74,0.15)]",
        warning:
          "border-transparent bg-gradient-to-r from-[#d4a948] to-[#b8860b] text-[#030305] shadow-[0_2px_8px_rgba(212,169,72,0.3)]",
        "warning-soft":
          "border-[rgba(212,169,72,0.2)] bg-[rgba(212,169,72,0.1)] text-[#d4a948] [a&]:hover:bg-[rgba(212,169,72,0.15)]",
        danger:
          "border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.1)] text-[#ef4444] [a&]:hover:bg-[rgba(220,38,38,0.15)]",
        glass:
          "border-[rgba(212,169,72,0.15)] bg-[rgba(212,169,72,0.05)] backdrop-blur-md text-[#fafaf9] [a&]:hover:bg-[rgba(212,169,72,0.1)] [a&]:hover:border-[rgba(212,169,72,0.25)]",
        dark: "border-[rgba(212,169,72,0.15)] bg-gradient-to-r from-[#18181b] to-[#0a0a0c] text-[#d4a948] shadow-[0_2px_8px_rgba(0,0,0,0.3)] [a&]:hover:border-[rgba(212,169,72,0.3)]",
        muted:
          "border-[rgba(161,161,170,0.2)] bg-[rgba(161,161,170,0.08)] text-[#a1a1aa] [a&]:hover:bg-[rgba(161,161,170,0.12)]",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
