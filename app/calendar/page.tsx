"use client";

/**
 * Calendar Page - Redesigned with i18n support
 * Modern, interactive income tracking calendar
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { th } from 'date-fns/locale';
import { useUserStore } from "@/lib/stores/user-store";
import { useIncomeStore } from "@/lib/stores/income-store";
import { useLanguage } from "@/lib/stores/language-store";
import { IncomeCalendar } from "@/components/features/calendar/income-calendar";
import { EntryPanel } from "@/components/features/calendar/entry-panel";
import { UserSwitcher } from "@/components/features/users/user-switcher";
import { UserModal } from "@/components/features/users/user-modal";
import { containerVariants, cardVariants } from "@/lib/animations";

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const currentMonth = new Date();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const activeUserId = useUserStore((state) => state.activeUserId);
  const activeUser = useUserStore((state) => state.getActiveUser());
  const users = useUserStore((state) => state.users);
  const { t, language } = useLanguage();

  const getStats = useIncomeStore((state) => state.getStats);
  const getMonthStats = useIncomeStore((state) => state.getMonthStats);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get stats
  const allTimeStats = activeUserId ? getStats(activeUserId) : null;
  const monthStats = activeUserId
    ? getMonthStats(activeUserId, currentMonth)
    : null;

  // Auto-create demo user if none exists
  useEffect(() => {
    if (users.length === 0) {
      const addUser = useUserStore.getState().addUser;
      addUser({
        username: "Demo User",
        totalEarnings: 0,
        entryCount: 0,
      });
    }
  }, [users]);

  if (!mounted) {
    return null;
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsPanelOpen(true);
  };

  const handleAddUser = () => {
    setEditingUserId(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setIsUserModalOpen(true);
  };

  const locale = language === 'th' ? th : undefined;

  const stats = [
    {
      label: t("calendar.totalIncome"),
      value: `$${allTimeStats?.totalIncome.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-[#10B981]",
      bgColor: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/30",
      change: null,
    },
    {
      label: t("calendar.totalProjects"),
      value: allTimeStats?.totalProjects || 0,
      icon: Briefcase,
      color: "text-[#00CED1]",
      bgColor: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      change: null,
    },
    {
      label: t("calendar.monthIncome"),
      value: `$${monthStats?.monthIncome.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-[#FFD700]",
      bgColor: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      change: null,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Enhanced Header with gradient background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/10 p-8 border border-primary/20 mb-6">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                  {t("calendar.title")}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("calendar.trackYourDaily")}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Enhanced Stats Cards with better animations */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/10 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* User Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <UserSwitcher onAddUser={handleAddUser} onEditUser={handleEditUser} />
      </motion.div>

      {/* Main Content - Improved Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - Takes more space */}
        <div className="lg:col-span-2">
          <IncomeCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Sidebar - Quick Actions & Info */}
        <div className="space-y-4">
          {/* Selected Date Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card bg-gradient-to-br from-primary/10 to-transparent border-primary/20"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {t("calendar.selectedDate")}
            </h3>
            {selectedDate ? (
              <>
                <p className="text-lg font-medium mb-2 text-muted-foreground">
                  {format(selectedDate, "EEEE", { locale })}
                </p>
                <p className="text-5xl font-bold gradient-text-gold mb-4">
                  {format(selectedDate, "d")}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {format(selectedDate, "MMMM yyyy", { locale })}
                </p>
                <motion.button
                  onClick={() => setIsPanelOpen(true)}
                  className="w-full px-4 py-3 gradient-gold text-white font-semibold rounded-xl hover:glow-gold transition-all shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("calendar.manageEntries")}
                </motion.button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("calendar.selectDate")}
              </p>
            )}
          </motion.div>

          {/* Quick Tips - Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20"
          >
            <h3 className="font-bold mb-4 text-lg">{t("calendar.quickTips")}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="text-primary mt-0.5 group-hover:scale-125 transition-transform">•</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {t("calendar.clickToAdd")}
                </span>
              </li>
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="text-emerald-400 mt-0.5 group-hover:scale-125 transition-transform">•</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {t("calendar.greenDates")}
                </span>
              </li>
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="text-cyan-400 mt-0.5 group-hover:scale-125 transition-transform">•</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {t("calendar.trackMultiple")}
                </span>
              </li>
              <li className="flex items-start gap-3 group cursor-pointer">
                <span className="text-purple-400 mt-0.5 group-hover:scale-125 transition-transform">•</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {t("calendar.viewMonthly")}
                </span>
              </li>
            </ul>
          </motion.div>

          {/* User Profile - Enhanced */}
          {activeUser && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20"
            >
              <h3 className="font-bold mb-4 text-lg">{t("calendar.yourProfile")}</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {activeUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{activeUser.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeUser.entryCount} {t("calendar.entries")}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">{t("calendar.totalEarnings")}</span>
                  <span className="font-bold gradient-text-gold text-base">
                    ${activeUser.totalEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">{t("calendar.memberSince")}</span>
                  <span className="font-medium">
                    {format(activeUser.createdAt, "MMM yyyy", { locale })}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Entry Management Panel */}
      <EntryPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        selectedDate={selectedDate}
      />

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUserId(null);
        }}
        userId={editingUserId}
      />
    </div>
  );
}
