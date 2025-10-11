'use client';

/**
 * Income Calendar Component - Redesigned
 * Modern, interactive calendar with better UX and i18n support
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, TrendingUp } from 'lucide-react';
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, setMonth as setMonthFn, setYear as setYearFn, getYear, getMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { useIncomeStore } from '@/lib/stores/income-store';
import { useUserStore } from '@/lib/stores/user-store';
import { useLanguage } from '@/lib/stores/language-store';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IncomeCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export function IncomeCalendar({ onDateSelect, selectedDate }: IncomeCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const activeUserId = useUserStore((state) => state.activeUserId);
  const { t, language } = useLanguage();

  // Get entries for current month
  const getEntriesByUserAndMonth = useIncomeStore((state) => state.getEntriesByUserAndMonth);
  const monthEntries = activeUserId ? getEntriesByUserAndMonth(activeUserId, month) : [];

  const locale = language === 'th' ? th : undefined;

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    return monthEntries.reduce((acc, entry) => {
      const dateKey = new Date(entry.date).toDateString();
      acc[dateKey] = (acc[dateKey] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [monthEntries]);

  // Helper function to get amount for a day
  const getDayAmount = (day: Date) => {
    const dateKey = day.toDateString();
    return dailyTotals[dateKey] || 0;
  };

  // Helper to check if day has income
  const hasIncome = (day: Date) => getDayAmount(day) > 0;

  // Calculate month's total income and stats
  const monthStats = useMemo(() => {
    const total = Object.values(dailyTotals).reduce((sum, amount) => sum + amount, 0);
    const daysWithIncome = Object.keys(dailyTotals).length;
    const avgPerDay = daysWithIncome > 0 ? total / daysWithIncome : 0;
    return { total, daysWithIncome, avgPerDay };
  }, [dailyTotals]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);

    // Add empty cells for days before month starts
    const emptyDays = Array(startDay).fill(null);
    return [...emptyDays, ...days];
  }, [month]);

  const weekDays = language === 'th'
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => setMonth(subMonths(month, 1));
  const handleNextMonth = () => setMonth(addMonths(month, 1));
  const handleToday = () => {
    setMonth(new Date());
    onDateSelect(new Date());
  };

  // Year and month change handlers
  const handleYearChange = (yearStr: string) => {
    const newDate = setYearFn(month, parseInt(yearStr));
    setMonth(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonthFn(month, parseInt(monthStr));
    setMonth(newDate);
  };

  // Generate year options (current year ± 5 years)
  const currentYear = getYear(new Date());
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Month names
  const monthNames = language === 'th'
    ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
       'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    : ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
    >
      {/* Modern Header with Stats */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t("calendar.title")}</h3>
              {/* Year and Month Selectors */}
              <div className="flex items-center gap-2 mt-1">
                <Select value={getMonth(month).toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[130px] h-7 text-xs bg-white/10 border-white/20">
                    <SelectValue>{monthNames[getMonth(month)]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, index) => (
                      <SelectItem key={index} value={index.toString()} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={getYear(month).toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[90px] h-7 text-xs bg-white/10 border-white/20">
                    <SelectValue>{getYear(month)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="text-xs">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {language === 'th' ? 'วันนี้' : 'Today'}
            </motion.button>

            <motion.button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Month Stats - Compact */}
        {monthStats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] text-emerald-300 uppercase">{language === 'th' ? 'รวม' : 'Total'}</p>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                ${monthStats.total.toLocaleString()}
              </p>
            </div>

            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                <p className="text-[10px] text-cyan-300 uppercase">{language === 'th' ? 'วัน' : 'Days'}</p>
              </div>
              <p className="text-lg font-bold text-cyan-400">
                {monthStats.daysWithIncome}
              </p>
            </div>

            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-[10px] text-purple-300 uppercase">{language === 'th' ? 'เฉลี่ย' : 'Avg'}</p>
              </div>
              <p className="text-lg font-bold text-purple-400">
                ${monthStats.avgPerDay.toFixed(0)}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Calendar Grid - Improved spacing */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days - Better grid */}
        <div className="grid grid-cols-7 gap-2">
          <AnimatePresence mode="wait">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const amount = getDayAmount(day);
              const hasInc = hasIncome(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, month);

              return (
                <motion.button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isCurrentMonth ? 1 : 0.3, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative aspect-square rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 p-2",
                    "hover:shadow-lg",
                    hasInc && "bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/40 hover:border-emerald-500/60",
                    isToday && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background",
                    isSelected && "bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-amber-600 text-white font-bold shadow-xl shadow-amber-500/50",
                    !hasInc && !isSelected && "hover:bg-white/10 border-2 border-transparent hover:border-white/20",
                    !isCurrentMonth && "opacity-30 cursor-not-allowed"
                  )}
                  disabled={!isCurrentMonth}
                >
                  <span className={cn(
                    "text-sm font-semibold",
                    isSelected && "text-white",
                    isToday && !isSelected && "text-amber-500"
                  )}>
                    {day.getDate()}
                  </span>
                  {hasInc && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                        isSelected ? "bg-white/30 text-white" : "bg-emerald-500/30 text-emerald-300"
                      )}
                    >
                      ${amount > 999 ? `${(amount/1000).toFixed(1)}k` : amount.toFixed(0)}
                    </motion.span>
                  )}

                  {/* Indicator dots */}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Modern Legend */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/5">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md ring-2 ring-amber-500" />
            <span className="text-muted-foreground">{language === 'th' ? 'วันนี้' : 'Today'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/40" />
            <span className="text-muted-foreground">{language === 'th' ? 'มีรายได้' : 'Has Income'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-500 to-orange-500" />
            <span className="text-muted-foreground">{language === 'th' ? 'เลือกแล้ว' : 'Selected'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
