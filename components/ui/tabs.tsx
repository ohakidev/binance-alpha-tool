"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-12 w-fit items-center justify-center rounded-xl p-1",
        // Premium background with gold accent
        "bg-gradient-to-r from-[rgba(212,169,72,0.06)] via-[rgba(10,10,12,0.95)] to-[rgba(184,134,11,0.04)]",
        // Border with gold hint
        "border border-[rgba(212,169,72,0.15)]",
        // Shadow for depth
        "shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(212,169,72,0.08)]",
        // Backdrop blur for glass effect
        "backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "relative inline-flex h-full flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2",
        "text-sm font-medium whitespace-nowrap",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Default state
        "text-[#a1a1aa]",
        "hover:text-[#d4a948]",
        "hover:bg-[rgba(212,169,72,0.08)]",
        // Active state - premium gold styling
        "data-[state=active]:text-[#030305]",
        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#d4a948] data-[state=active]:via-[#b8860b] data-[state=active]:to-[#d4a948]",
        "data-[state=active]:shadow-[0_4px_12px_rgba(212,169,72,0.3),inset_0_1px_0_rgba(245,212,133,0.3)]",
        "data-[state=active]:font-semibold",
        // Focus state
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[rgba(212,169,72,0.5)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg]:transition-all [&_svg]:duration-300",
        "data-[state=active]:[&_svg]:text-[#030305]",
        "hover:[&_svg]:text-[#d4a948]",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        // Animation for content transition
        "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0",
        "data-[state=active]:animate-in data-[state=active]:fade-in-0",
        "data-[state=active]:duration-300",
        className,
      )}
      {...props}
    />
  );
}

// Premium variant of TabsList with more prominent styling
function TabsListPremium({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list-premium"
      className={cn(
        "inline-flex h-14 w-fit items-center justify-center rounded-2xl p-1.5",
        // Premium background with stronger gold accent
        "bg-gradient-to-br from-[rgba(212,169,72,0.1)] via-[#0a0a0c] to-[rgba(184,134,11,0.08)]",
        // Border with gold glow
        "border border-[rgba(212,169,72,0.2)]",
        // Enhanced shadow with gold tint
        "shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_40px_rgba(212,169,72,0.06),inset_0_1px_0_rgba(212,169,72,0.12)]",
        // Backdrop blur
        "backdrop-blur-md",
        // Top shine line
        "before:absolute before:top-0 before:left-4 before:right-4 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(212,169,72,0.3)] before:to-transparent",
        "relative overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

// Premium trigger with animated indicator
function TabsTriggerPremium({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger-premium"
      className={cn(
        // Base styles
        "relative inline-flex h-full flex-1 items-center justify-center gap-2.5 rounded-xl px-5 py-2.5",
        "text-sm font-medium whitespace-nowrap",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Default state with subtle hover
        "text-[#a1a1aa]",
        "hover:text-[#f5d485]",
        "hover:bg-[rgba(212,169,72,0.1)]",
        // Active state - premium gold gradient with shine
        "data-[state=active]:text-[#030305]",
        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5d485] data-[state=active]:via-[#d4a948] data-[state=active]:to-[#b8860b]",
        "data-[state=active]:shadow-[0_6px_16px_rgba(212,169,72,0.35),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(139,115,85,0.2)]",
        "data-[state=active]:font-semibold",
        // Glow effect on active
        "data-[state=active]:before:absolute data-[state=active]:before:inset-0",
        "data-[state=active]:before:rounded-xl",
        "data-[state=active]:before:shadow-[0_0_20px_rgba(212,169,72,0.3)]",
        "data-[state=active]:before:pointer-events-none",
        // Focus state
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[rgba(212,169,72,0.5)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg]:transition-all [&_svg]:duration-300",
        "data-[state=active]:[&_svg]:text-[#030305]",
        "hover:[&_svg]:text-[#f5d485]",
        className,
      )}
      {...props}
    />
  );
}

// Glass variant of TabsList
function TabsListGlass({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list-glass"
      className={cn(
        "inline-flex h-11 w-fit items-center justify-center rounded-xl p-1",
        // Glass background
        "bg-[rgba(212,169,72,0.03)]",
        "backdrop-blur-xl",
        // Subtle border
        "border border-[rgba(212,169,72,0.1)]",
        // Soft shadow
        "shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(212,169,72,0.05)]",
        className,
      )}
      {...props}
    />
  );
}

// Minimal trigger for glass tabs
function TabsTriggerGlass({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger-glass"
      className={cn(
        // Base styles
        "relative inline-flex h-full flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5",
        "text-sm font-medium whitespace-nowrap",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Default state
        "text-[#a1a1aa]",
        "hover:text-[#d4a948]",
        "hover:bg-[rgba(212,169,72,0.06)]",
        // Active state - subtle gold
        "data-[state=active]:text-[#d4a948]",
        "data-[state=active]:bg-[rgba(212,169,72,0.12)]",
        "data-[state=active]:border data-[state=active]:border-[rgba(212,169,72,0.2)]",
        "data-[state=active]:shadow-[0_2px_8px_rgba(212,169,72,0.15)]",
        // Focus state
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[rgba(212,169,72,0.4)]",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // SVG styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsListPremium,
  TabsTriggerPremium,
  TabsListGlass,
  TabsTriggerGlass,
};
