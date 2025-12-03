"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto",
        // Premium scrollbar
        "scrollbar-thin scrollbar-thumb-[rgba(212,169,72,0.3)] scrollbar-track-transparent",
        "[&::-webkit-scrollbar]:h-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-gradient-to-r [&::-webkit-scrollbar-thumb]:from-[rgba(212,169,72,0.3)] [&::-webkit-scrollbar-thumb]:to-[rgba(184,134,11,0.3)]",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:from-[rgba(212,169,72,0.5)] [&::-webkit-scrollbar-thumb:hover]:to-[rgba(184,134,11,0.5)]",
      )}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm",
          "border-separate border-spacing-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:border-[rgba(212,169,72,0.1)]",
        "bg-gradient-to-r from-[rgba(212,169,72,0.06)] via-[rgba(10,10,12,0.95)] to-[rgba(184,134,11,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-gradient-to-r from-[rgba(212,169,72,0.08)] via-[rgba(10,10,12,0.98)] to-[rgba(184,134,11,0.05)]",
        "border-t border-[rgba(212,169,72,0.15)]",
        "font-medium",
        "[&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-[rgba(212,169,72,0.08)]",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Hover state with gold accent
        "hover:bg-[rgba(212,169,72,0.04)]",
        "hover:shadow-[inset_0_0_20px_rgba(212,169,72,0.03)]",
        // Selected state
        "data-[state=selected]:bg-[rgba(212,169,72,0.08)]",
        "data-[state=selected]:border-[rgba(212,169,72,0.15)]",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold whitespace-nowrap",
        "text-[#d4a948] text-xs uppercase tracking-wider",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        // Subtle bottom border
        "border-b border-[rgba(212,169,72,0.15)]",
        // First column special styling
        "first:pl-6 last:pr-6",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-4 align-middle whitespace-nowrap",
        "text-[#fafaf9]",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        // First and last column padding
        "first:pl-6 last:pr-6",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-[#a1a1aa]", className)}
      {...props}
    />
  );
}

// Premium Table Wrapper with card styling
function TableWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-wrapper"
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
        "border border-[rgba(212,169,72,0.12)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(212,169,72,0.08)]",
        // Top shine line
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(212,169,72,0.3)] before:to-transparent",
        "before:z-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Premium empty state for tables
function TableEmpty({
  className,
  children,
  icon,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode;
}) {
  return (
    <div
      data-slot="table-empty"
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        "text-center",
        className,
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-[rgba(212,169,72,0.3)]">{icon}</div>}
      <div className="text-[#a1a1aa] text-sm">
        {children || "No data available"}
      </div>
    </div>
  );
}

// Loading skeleton for table rows
function TableRowSkeleton({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={cn("border-b border-[rgba(212,169,72,0.08)]", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4 first:pl-6 last:pr-6">
          <div
            className={cn(
              "h-5 rounded-md animate-pulse",
              "bg-gradient-to-r from-[rgba(212,169,72,0.05)] via-[rgba(212,169,72,0.1)] to-[rgba(212,169,72,0.05)]",
              "bg-[length:200%_100%]",
              i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "w-24",
            )}
            style={{
              animationDelay: `${i * 100}ms`,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableWrapper,
  TableEmpty,
  TableRowSkeleton,
};
