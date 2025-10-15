"use client";

/**
 * Main Navigation Component
 * Game-style navigation with smooth animations
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Settings,
  Calculator,
  Menu,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { LanguageSwitcher } from "./language-switcher";
import { useLanguage } from "@/lib/stores/language-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navigation() {
  const pathname = usePathname();
  const { setSidebarOpen } = useUIStore();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only using translations after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/", label: t("nav.airdrops"), icon: Sparkles },
    { href: "/calculator", label: t("nav.calculator"), icon: Calculator },
    { href: "/stability", label: t("nav.stability"), icon: TrendingUp },
    { href: "/calendar", label: t("nav.calendar"), icon: Calendar },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text-gold">
                Binance Alpha
              </span>
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-1 relative">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className="relative px-4 py-2 rounded-lg transition-all hover:bg-primary/10 hover:scale-105"
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-5 h-5 transition-colors ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`font-medium transition-colors ${
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            suppressHydrationWarning
                          >
                            {item.label}
                          </span>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute bottom-0 left-0 right-0 h-0.5 gradient-gold rounded-full"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                          />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-primary text-primary-foreground">
                      <p className="text-sm font-medium" suppressHydrationWarning>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative active:scale-95 transition-transform"
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1.15 : 1,
                        y: isActive ? -3 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon
                        className={`w-6 h-6 transition-colors ${
                          isActive ? "text-primary drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-muted-foreground"
                        }`}
                      />
                    </motion.div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                      suppressHydrationWarning
                    >
                      {item.label}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeMobileNav"
                        className="absolute top-0 w-12 h-1 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-primary text-primary-foreground mb-2">
                  <p className="text-sm font-medium" suppressHydrationWarning>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold gradient-text-gold">Binance Alpha</span>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}
