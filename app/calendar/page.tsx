"use client";

/**
 * Calendar Page - Redesigned with full i18n support
 * Modern, interactive income tracking calendar with enhanced UI/UX
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Briefcase,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Award,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { useUserStore } from "@/lib/stores/user-store";
import { useIncomeStore } from "@/lib/stores/income-store";
import { useLanguage } from "@/lib/stores/language-store";
import { IncomeCalendar } from "@/components/features/calendar/income-calendar";
import { EntryPanel } from "@/components/features/calendar/entry-panel";
import { UserSwitcher } from "@/components/features/users/user-switcher";
import { UserModal } from "@/components/features/users/user-modal";
import { containerVariants, cardVariants } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
        balance: 0,
      });
    }
  }, [users]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
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

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const locale = language === "th" ? th : enUS;

  const stats = [
    {
      label: t("calendar.totalIncome"),
      value: `$${allTimeStats?.totalIncome.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
    },
    {
      label: t("calendar.totalProjects"),
      value: allTimeStats?.totalProjects || 0,
      icon: Briefcase,
      color: "text-cyan-400",
      bgColor: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      iconBg: "bg-cyan-500/20",
    },
    {
      label: t("calendar.monthIncome"),
      value: `$${monthStats?.monthIncome.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      iconBg: "bg-amber-500/20",
    },
  ];

  // Calculate progress towards monthly goal (example: $1000)
  const monthlyGoal = 1000;
  const monthProgress = Math.min(
    ((monthStats?.monthIncome || 0) / monthlyGoal) * 100,
    100,
  );

  return (
    <div
      key={`calendar-${language}`}
      className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Enhanced Header */}
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/10 p-8 border border-amber-500/20 mb-6"
          >
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <CalendarIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
                      {t("calendar.title")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("calendar.trackYourDaily")}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                    className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                  >
                    <Target className="w-4 h-4" />
                    {t("calendar.today")}
                  </Button>
                  <Button
                    onClick={() => setIsPanelOpen(true)}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    {t("calendar.addEntry")}
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            />
          </motion.div>

          {/* Stats Cards */}
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
              >
                <Card
                  className={`bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} hover:shadow-lg transition-all cursor-pointer backdrop-blur-xl`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* User Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <UserSwitcher onAddUser={handleAddUser} onEditUser={handleEditUser} />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Month Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePreviousMonth}
                      className="gap-1 hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t("calendar.previousMonth")}
                    </Button>

                    <h2 className="text-xl font-semibold">
                      {format(currentMonth, "MMMM yyyy", { locale })}
                    </h2>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextMonth}
                      className="gap-1 hover:bg-white/10"
                    >
                      {t("calendar.nextMonth")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <IncomeCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Date Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 backdrop-blur-xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {t("calendar.selectedDate")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="text-center py-4">
                      <p className="text-lg font-medium mb-2 text-muted-foreground">
                        {format(selectedDate, "EEEE", { locale })}
                      </p>
                      <motion.p
                        key={selectedDate.toISOString()}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2"
                      >
                        {format(selectedDate, "d")}
                      </motion.p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {format(selectedDate, "MMMM yyyy", { locale })}
                      </p>
                      <Button
                        onClick={() => setIsPanelOpen(true)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("calendar.manageEntries")}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("calendar.selectDate")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Goal Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-emerald-400" />
                    {t("calendar.monthlyIncome")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t("common.progress")}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/20 text-emerald-400"
                      >
                        {monthProgress.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={monthProgress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-emerald-400">
                        ${monthStats?.monthIncome.toFixed(2) || "0.00"}
                      </span>
                      <span className="text-muted-foreground">
                        / ${monthlyGoal}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    {t("calendar.quickTips")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {[
                      { text: t("calendar.clickToAdd"), color: "text-primary" },
                      {
                        text: t("calendar.greenDates"),
                        color: "text-emerald-400",
                      },
                      {
                        text: t("calendar.trackMultiple"),
                        color: "text-cyan-400",
                      },
                      {
                        text: t("calendar.viewMonthly"),
                        color: "text-purple-400",
                      },
                    ].map((tip, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-3 group cursor-pointer"
                      >
                        <span
                          className={`${tip.color} mt-0.5 group-hover:scale-125 transition-transform`}
                        >
                          •
                        </span>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {tip.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Profile */}
            {activeUser && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {t("calendar.yourProfile")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                      >
                        {activeUser.username.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg truncate">
                          {activeUser.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeUser.entryCount} {t("calendar.entries")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-muted-foreground">
                          {t("calendar.totalEarnings")}
                        </span>
                        <span className="font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                          ${activeUser.totalEarnings.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-muted-foreground">
                          {t("calendar.memberSince")}
                        </span>
                        <span className="font-medium">
                          {format(activeUser.createdAt, "MMM yyyy", { locale })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
      </motion.div>
    </div>
  );
}
