"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default" | "lg";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Base styles
        "flex w-fit items-center justify-between gap-2 rounded-xl px-4 py-2.5",
        "text-sm font-medium whitespace-nowrap",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "outline-none",
        // Background and border with gold accent
        "bg-[rgba(212,169,72,0.03)]",
        "border border-[rgba(212,169,72,0.15)]",
        // Text colors
        "text-[#fafaf9]",
        "data-[placeholder]:text-[rgba(161,161,170,0.6)]",
        // Icon styling
        "[&_svg:not([class*='text-'])]:text-[#d4a948]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Focus state with gold glow
        "focus-visible:bg-[rgba(212,169,72,0.05)]",
        "focus-visible:border-[rgba(212,169,72,0.4)]",
        "focus-visible:shadow-[0_0_0_3px_rgba(212,169,72,0.1),0_0_20px_rgba(212,169,72,0.1)]",
        // Hover state
        "hover:bg-[rgba(212,169,72,0.06)]",
        "hover:border-[rgba(212,169,72,0.25)]",
        // Invalid state
        "aria-invalid:border-[#b91c1c]",
        "aria-invalid:focus-visible:shadow-[0_0_0_3px_rgba(185,28,28,0.2)]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:bg-[rgba(24,24,27,0.5)]",
        // Size variants
        "data-[size=default]:h-11",
        "data-[size=sm]:h-9 data-[size=sm]:px-3 data-[size=sm]:text-xs",
        "data-[size=lg]:h-12 data-[size=lg]:px-5",
        // Select value styling
        "*:data-[slot=select-value]:line-clamp-1",
        "*:data-[slot=select-value]:flex",
        "*:data-[slot=select-value]:items-center",
        "*:data-[slot=select-value]:gap-2",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-[#d4a948] transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          // Base styles
          "relative z-50 overflow-hidden rounded-xl",
          "min-w-[8rem] max-h-[--radix-select-content-available-height]",
          "origin-[--radix-select-content-transform-origin]",
          // Premium background with gold accent
          "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
          "backdrop-blur-xl",
          // Border with gold tint
          "border border-[rgba(212,169,72,0.15)]",
          // Shadow with gold glow
          "shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_40px_rgba(212,169,72,0.06)]",
          // Text color
          "text-[#fafaf9]",
          // Animation
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          // Position adjustments
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1.5",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 py-2 text-xs font-semibold uppercase tracking-wider",
        "text-[#d4a948]",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base styles
        "relative flex w-full cursor-pointer items-center gap-2 rounded-lg",
        "py-2.5 pr-10 pl-3 text-sm font-medium",
        "outline-none select-none",
        "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Default state
        "text-[#fafaf9]",
        // Focus/hover state with gold accent
        "focus:bg-[rgba(212,169,72,0.12)]",
        "focus:text-[#f5d485]",
        "hover:bg-[rgba(212,169,72,0.08)]",
        // Data highlighted state
        "data-[highlighted]:bg-[rgba(212,169,72,0.12)]",
        "data-[highlighted]:text-[#f5d485]",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Icon styling
        "[&_svg:not([class*='text-'])]:text-[#d4a948]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Span styling for complex content
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-[#d4a948]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1.5 h-px",
        "bg-gradient-to-r from-transparent via-[rgba(212,169,72,0.2)] to-transparent",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5",
        "text-[#d4a948]",
        "bg-gradient-to-b from-[rgba(212,169,72,0.08)] to-transparent",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1.5",
        "text-[#d4a948]",
        "bg-gradient-to-t from-[rgba(212,169,72,0.08)] to-transparent",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
