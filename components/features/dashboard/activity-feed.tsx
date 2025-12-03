"use client";

/**
 * Activity Feed Component
 * Real-time feed of recent income entries and activities
 */

import { motion, AnimatePresence } from "framer-motion";
import { useIncomeStore } from "@/lib/stores/income-store";
import { useUserStore } from "@/lib/stores/user-store";
import { format } from "date-fns";
import { TrendingUp, DollarSign, Calendar, Award } from "lucide-react";

const categoryIcons = {
  Airdrop: Award,
  Trading: TrendingUp,
  Staking: DollarSign,
  Other: Calendar,
};

const categoryColors = {
  Airdrop: "text-[#FFD700]",
  Trading: "text-[#10B981]",
  Staking: "text-[#00CED1]",
  Other: "text-[#9B59B6]",
};

export function ActivityFeed() {
  const activeUserId = useUserStore((state) => state.activeUserId);
  const entries = useIncomeStore((state) => state.entries);
  const users = useUserStore((state) => state.users);

  // Get recent entries (last 10)
  const recentEntries = entries
    .filter((entry) => entry.userId === activeUserId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const activeUser = users.find((u) => u.id === activeUserId);

  if (!activeUser || recentEntries.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No recent activity</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add your first income entry to see activity here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#FFD700]" />
        Recent Activity
      </h3>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {recentEntries.map((entry, index) => {
            const Icon =
              categoryIcons[entry.category as keyof typeof categoryIcons] ||
              Calendar;
            const colorClass =
              categoryColors[entry.category as keyof typeof categoryColors] ||
              "text-muted-foreground";

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg bg-white/5 ${colorClass} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {entry.projectName}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${colorClass}`}
                    >
                      {entry.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.date), "MMM dd, yyyy")}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {entry.notes}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p
                    className={`font-bold ${entry.amount >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                  >
                    {entry.amount >= 0 ? "+" : ""}${entry.amount.toFixed(2)}
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="absolute inset-0 rounded-lg border border-[#FFD700]/0 group-hover:border-[#FFD700]/30 transition-colors pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* View All Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
        onClick={() => (window.location.href = "/calendar")}
      >
        View All Entries →
      </motion.button>
    </div>
  );
}
