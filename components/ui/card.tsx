import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "relative flex flex-col gap-6 rounded-2xl py-6",
        "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
        "border border-[rgba(212,169,72,0.12)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(212,169,72,0.08)]",
        "backdrop-blur-sm",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:border-[rgba(212,169,72,0.2)]",
        "hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_40px_rgba(212,169,72,0.06)]",
        "hover:-translate-y-1",
        "overflow-hidden",
        // Top shine line
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(212,169,72,0.4)] before:to-transparent",
        "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "[.border-b]:pb-6 [.border-b]:border-[rgba(212,169,72,0.1)]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-none font-semibold tracking-tight",
        "text-[#fafaf9]",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[#a1a1aa]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6",
        "[.border-t]:pt-6 [.border-t]:border-[rgba(212,169,72,0.1)]",
        className,
      )}
      {...props}
    />
  );
}

// Premium Card Variant with gold accents
function CardPremium({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-premium"
      className={cn(
        "relative flex flex-col gap-6 rounded-2xl py-6",
        "bg-gradient-to-br from-[rgba(212,169,72,0.08)] via-[#0a0a0c] to-[rgba(184,134,11,0.05)]",
        "border border-[rgba(212,169,72,0.2)]",
        "shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(212,169,72,0.08),inset_0_1px_0_rgba(212,169,72,0.15)]",
        "backdrop-blur-md",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:border-[rgba(212,169,72,0.35)]",
        "hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_80px_rgba(212,169,72,0.12)]",
        "hover:-translate-y-1.5",
        "overflow-hidden",
        // Top gold shine line
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(212,169,72,0.6)] before:to-transparent",
        // Bottom subtle line
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px",
        "after:bg-gradient-to-r after:from-transparent after:via-[rgba(212,169,72,0.2)] after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

// Glass Card Variant
function CardGlass({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-glass"
      className={cn(
        "relative flex flex-col gap-6 rounded-2xl py-6",
        "bg-[rgba(212,169,72,0.03)]",
        "backdrop-blur-2xl",
        "border border-[rgba(212,169,72,0.1)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(212,169,72,0.1)]",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:bg-[rgba(212,169,72,0.05)]",
        "hover:border-[rgba(212,169,72,0.18)]",
        "hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

// Dark Card Variant
function CardDark({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-dark"
      className={cn(
        "relative flex flex-col gap-6 rounded-xl py-6",
        "bg-gradient-to-b from-[rgba(24,24,27,0.9)] to-[rgba(10,10,12,0.98)]",
        "border border-[rgba(212,169,72,0.08)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:border-[rgba(212,169,72,0.15)]",
        "hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]",
        "overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardPremium,
  CardGlass,
  CardDark,
};
