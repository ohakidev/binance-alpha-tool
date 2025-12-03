"use client";

/**
 * Premium Navigation Component
 * Luxurious animations and smooth transitions
 */

import { motion, AnimatePresence } from "framer-motion";
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
  X,
  ChevronRight,
  LucideIcon,
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
import { springConfigs, easings } from "@/lib/animations";
import { BorderBeam } from "@/components/ui/border-beam";
import { MagicCard } from "@/components/ui/magic-card";

// Navigation items configuration
const getNavItems = (t: (key: string) => string) => [
  { href: "/", label: t("nav.airdrops"), icon: Sparkles, color: "#fbbf24" },
  {
    href: "/calculator",
    label: t("nav.calculator"),
    icon: Calculator,
    color: "#06b6d4",
  },
  {
    href: "/stability",
    label: t("nav.stability"),
    icon: TrendingUp,
    color: "#22c55e",
  },
  {
    href: "/calendar",
    label: t("nav.calendar"),
    icon: Calendar,
    color: "#a855f7",
  },
  {
    href: "/settings",
    label: t("nav.settings"),
    icon: Settings,
    color: "#f97316",
  },
];

// Desktop Navigation Link Component
function DesktopNavLink({
  href,
  label,
  icon: Icon,
  color,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  isActive: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative px-4 py-2.5 rounded-xl overflow-hidden">
            {/* Background & Border Beam for active state */}
            {isActive && (
              <div className="absolute inset-0 bg-white/5 rounded-xl">
                <BorderBeam
                  size={40}
                  duration={4}
                  delay={0}
                  colorFrom={color}
                  colorTo={`${color}00`}
                  borderWidth={1.5}
                />
              </div>
            )}

            {/* Hover Background */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-white/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered && !isActive ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-2.5 z-10">
              <motion.div
                animate={{
                  scale: isHovered || isActive ? 1.1 : 1,
                  rotate: isHovered ? [0, -10, 10, 0] : 0,
                }}
                transition={{
                  scale: { duration: 0.2 },
                  rotate: { duration: 0.4, ease: "easeInOut" },
                }}
              >
                <Icon
                  className="w-5 h-5 transition-all duration-300"
                  style={{
                    color: isActive || isHovered ? color : "rgb(156 163 175)",
                    filter: isActive ? `drop-shadow(0 0 8px ${color}80)` : "none",
                  }}
                />
              </motion.div>
              <span
                className="font-medium transition-all duration-300"
                style={{
                  color: isActive
                    ? color
                    : isHovered
                      ? "#f0f0f5"
                      : "rgb(156 163 175)",
                }}
                suppressHydrationWarning
              >
                {label}
              </span>
            </div>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-none shadow-lg shadow-primary/20"
      >
        <p className="text-sm font-medium" suppressHydrationWarning>
          {label}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({
  href,
  label,
  icon: Icon,
  color,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
  isActive: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative py-2"
        >
          {/* Active background pill */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                layoutId="activeMobileNavBg"
                className="absolute inset-x-2 inset-y-1 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                  border: `1px solid ${color}30`,
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springConfigs.stiff}
              />
            )}
          </AnimatePresence>

          {/* Icon container */}
          <motion.div
            className="relative"
            animate={{
              scale: isActive ? 1.15 : 1,
              y: isActive ? -2 : 0,
            }}
            whileTap={{ scale: 0.9 }}
            transition={springConfigs.stiff}
          >
            {/* Icon glow */}
            {isActive && (
              <motion.div
                className="absolute inset-0 blur-lg"
                style={{ backgroundColor: color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 0.3 }}
              />
            )}
            <Icon
              className="w-6 h-6 relative z-10 transition-all duration-300"
              style={{
                color: isActive ? color : "rgb(156 163 175)",
                filter: isActive ? `drop-shadow(0 0 10px ${color})` : "none",
              }}
            />
          </motion.div>

          {/* Label */}
          <motion.span
            className="text-xs font-medium relative z-10"
            style={{
              color: isActive ? color : "rgb(156 163 175)",
            }}
            animate={{
              opacity: isActive ? 1 : 0.7,
            }}
            suppressHydrationWarning
          >
            {label}
          </motion.span>

          {/* Top indicator dot */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                layoutId="activeMobileNavDot"
                className="absolute top-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={springConfigs.bouncy}
              />
            )}
          </AnimatePresence>
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground border-none shadow-lg shadow-primary/20 mb-2"
      >
        <p className="text-sm font-medium" suppressHydrationWarning>
          {label}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Main Navigation Component
export function Navigation() {
  const pathname = usePathname();
  const { setSidebarOpen, sidebarOpen } = useUIStore();
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  const navItems = getNavItems(t);

  // Handle scroll for navbar blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logo component with animation
  const Logo = ({ size = "default" }: { size?: "default" | "small" }) => {
    const [isHovered, setIsHovered] = useState(false);
    const iconSize = size === "small" ? "w-5 h-5" : "w-6 h-6";
    const containerSize = size === "small" ? "w-8 h-8" : "w-10 h-10";

    return (
      <Link
        href="/"
        className="flex items-center gap-2.5 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className={`${containerSize} rounded-xl flex items-center justify-center relative overflow-hidden`}
          animate={{
            scale: isHovered ? 1.05 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={springConfigs.stiff}
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: isHovered ? ["-100%", "100%"] : "-100%",
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          <motion.div
            animate={{
              rotate: isHovered ? 360 : 0,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Sparkles
              className={`${iconSize} text-primary-foreground relative z-10`}
            />
          </motion.div>
        </motion.div>

        <motion.span
          className="text-xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent"
          style={{
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: isHovered
              ? ["0% 50%", "100% 50%", "0% 50%"]
              : "0% 50%",
          }}
          transition={{
            duration: 2,
            ease: "linear",
            repeat: isHovered ? Infinity : 0,
          }}
        >
          Binance Alpha
        </motion.span>
      </Link>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Desktop Navigation */}
      <motion.nav
        className="hidden md:block fixed top-0 left-0 right-0 z-40"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easings.premium }}
      >
        <motion.div
          className="backdrop-blur-xl border-b transition-all duration-300"
          style={{
            background: isScrolled
              ? "linear-gradient(135deg, rgba(12, 18, 34, 0.95) 0%, rgba(5, 8, 22, 0.98) 100%)"
              : "linear-gradient(135deg, rgba(12, 18, 34, 0.8) 0%, rgba(5, 8, 22, 0.85) 100%)",
            borderColor: isScrolled
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.05)",
            boxShadow: isScrolled
              ? "0 4px 30px rgba(0, 0, 0, 0.3), 0 0 40px rgba(251, 191, 36, 0.05)"
              : "none",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Logo />

              {/* Nav Items */}
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <DesktopNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    color={item.color}
                    isActive={pathname === item.href}
                  />
                ))}
              </div>

              {/* User Actions */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <LanguageSwitcher />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Gradient line at bottom */}
        <motion.div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), rgba(6, 182, 212, 0.3), transparent)",
          }}
          animate={{
            opacity: isScrolled ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.nav>

      {/* Mobile Bottom Navigation */}
      <motion.nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easings.premium }}
      >
        {/* Gradient border at top */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.4), rgba(6, 182, 212, 0.4), transparent)",
          }}
        />

        <div
          className="backdrop-blur-xl border-t"
          style={{
            background:
              "linear-gradient(180deg, rgba(12, 18, 34, 0.95) 0%, rgba(5, 8, 22, 0.98) 100%)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex items-center justify-around h-16 px-1">
            {navItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                color={item.color}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* Safe area for iOS */}
        <div
          className="h-[env(safe-area-inset-bottom)]"
          style={{
            background: "rgba(5, 8, 22, 0.98)",
          }}
        />
      </motion.nav>

      {/* Mobile Header */}
      <motion.div
        className="md:hidden fixed top-0 left-0 right-0 z-40"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easings.premium }}
      >
        <motion.div
          className="backdrop-blur-xl border-b transition-all duration-300"
          style={{
            background: isScrolled
              ? "linear-gradient(135deg, rgba(12, 18, 34, 0.98) 0%, rgba(5, 8, 22, 0.98) 100%)"
              : "linear-gradient(135deg, rgba(12, 18, 34, 0.9) 0%, rgba(5, 8, 22, 0.9) 100%)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            boxShadow: isScrolled ? "0 4px 30px rgba(0, 0, 0, 0.3)" : "none",
          }}
        >
          <div className="flex items-center justify-between h-14 px-4">
            <Logo size="small" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl transition-colors relative overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {sidebarOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Gradient line */}
        <motion.div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), transparent)",
          }}
          animate={{
            opacity: isScrolled ? 1 : 0.5,
          }}
        />
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar Panel */}
            <motion.div
              className="md:hidden fixed top-0 right-0 bottom-0 w-72 z-50"
              style={{
                background:
                  "linear-gradient(180deg, rgba(12, 18, 34, 0.98) 0%, rgba(5, 8, 22, 0.99) 100%)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={springConfigs.stiff}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="font-semibold text-lg">Menu</span>
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Nav Items */}
              <div className="p-4 space-y-2">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all group relative overflow-hidden"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${item.color}15 0%, transparent 100%)`
                            : "transparent",
                          border: isActive
                            ? `1px solid ${item.color}30`
                            : "1px solid transparent",
                        }}
                      >
                        <Icon
                          className="w-5 h-5 transition-colors"
                          style={{
                            color: isActive ? item.color : "rgb(156 163 175)",
                          }}
                        />
                        <span
                          className="font-medium flex-1"
                          style={{
                            color: isActive ? item.color : "rgb(156 163 175)",
                          }}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: item.color }}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <div className="text-center text-xs text-muted-foreground">
                  Binance Alpha Tool v1.0
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
