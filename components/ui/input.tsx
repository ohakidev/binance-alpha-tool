import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "premium" | "glass";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      default: [
        "bg-[rgba(212,169,72,0.03)]",
        "border-[rgba(212,169,72,0.15)]",
        "text-[#fafaf9]",
        "placeholder:text-[rgba(161,161,170,0.6)]",
        "focus:bg-[rgba(212,169,72,0.05)]",
        "focus:border-[rgba(212,169,72,0.4)]",
        "focus:shadow-[0_0_0_3px_rgba(212,169,72,0.1),0_0_20px_rgba(212,169,72,0.1)]",
      ],
      premium: [
        "bg-gradient-to-r from-[rgba(212,169,72,0.05)] to-[rgba(184,134,11,0.03)]",
        "border-[rgba(212,169,72,0.25)]",
        "text-[#fafaf9]",
        "placeholder:text-[rgba(161,161,170,0.5)]",
        "focus:from-[rgba(212,169,72,0.08)]",
        "focus:to-[rgba(184,134,11,0.05)]",
        "focus:border-[rgba(212,169,72,0.5)]",
        "focus:shadow-[0_0_0_3px_rgba(212,169,72,0.15),0_0_30px_rgba(212,169,72,0.15)]",
        "shadow-[inset_0_1px_0_rgba(212,169,72,0.05)]",
      ],
      glass: [
        "bg-[rgba(212,169,72,0.02)]",
        "backdrop-blur-xl",
        "border-[rgba(212,169,72,0.1)]",
        "text-[#fafaf9]",
        "placeholder:text-[rgba(161,161,170,0.5)]",
        "focus:bg-[rgba(212,169,72,0.05)]",
        "focus:border-[rgba(212,169,72,0.3)]",
        "focus:shadow-[0_0_0_3px_rgba(212,169,72,0.08),0_8px_20px_rgba(0,0,0,0.2)]",
      ],
    };

    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-xl border px-4 py-2.5",
          "text-base md:text-sm font-medium",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "outline-none",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "file:text-[#d4a948] file:cursor-pointer",
          // Selection styles
          "selection:bg-[rgba(212,169,72,0.25)] selection:text-[#d4a948]",
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:bg-[rgba(24,24,27,0.5)]",
          // Invalid styles
          "aria-invalid:border-[#b91c1c]",
          "aria-invalid:focus:border-[#b91c1c]",
          "aria-invalid:focus:shadow-[0_0_0_3px_rgba(185,28,28,0.2)]",
          // Variant styles
          variants[variant],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

// Premium styled textarea that matches the input
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    variant?: "default" | "premium" | "glass";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: [
      "bg-[rgba(212,169,72,0.03)]",
      "border-[rgba(212,169,72,0.15)]",
      "text-[#fafaf9]",
      "placeholder:text-[rgba(161,161,170,0.6)]",
      "focus:bg-[rgba(212,169,72,0.05)]",
      "focus:border-[rgba(212,169,72,0.4)]",
      "focus:shadow-[0_0_0_3px_rgba(212,169,72,0.1),0_0_20px_rgba(212,169,72,0.1)]",
    ],
    premium: [
      "bg-gradient-to-r from-[rgba(212,169,72,0.05)] to-[rgba(184,134,11,0.03)]",
      "border-[rgba(212,169,72,0.25)]",
      "text-[#fafaf9]",
      "placeholder:text-[rgba(161,161,170,0.5)]",
      "focus:from-[rgba(212,169,72,0.08)]",
      "focus:to-[rgba(184,134,11,0.05)]",
      "focus:border-[rgba(212,169,72,0.5)]",
      "focus:shadow-[0_0_0_3px_rgba(212,169,72,0.15),0_0_30px_rgba(212,169,72,0.15)]",
    ],
    glass: [
      "bg-[rgba(212,169,72,0.02)]",
      "backdrop-blur-xl",
      "border-[rgba(212,169,72,0.1)]",
      "text-[#fafaf9]",
      "placeholder:text-[rgba(161,161,170,0.5)]",
      "focus:bg-[rgba(212,169,72,0.05)]",
      "focus:border-[rgba(212,169,72,0.3)]",
      "focus:shadow-[0_0_0_3px_rgba(212,169,72,0.08)]",
    ],
  };

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        "flex min-h-[100px] w-full rounded-xl border px-4 py-3",
        "text-base md:text-sm font-medium",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "outline-none resize-none",
        // Selection styles
        "selection:bg-[rgba(212,169,72,0.25)] selection:text-[#d4a948]",
        // Disabled styles
        "disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:bg-[rgba(24,24,27,0.5)]",
        // Invalid styles
        "aria-invalid:border-[#b91c1c]",
        "aria-invalid:focus:border-[#b91c1c]",
        "aria-invalid:focus:shadow-[0_0_0_3px_rgba(185,28,28,0.2)]",
        // Custom scrollbar
        "scrollbar-thin scrollbar-thumb-[rgba(212,169,72,0.3)] scrollbar-track-transparent",
        // Variant styles
        variants[variant],
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Input, Textarea };
