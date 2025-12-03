"use client";

/**
 * Entry Management Panel
 * Slide-in panel for managing income entries
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit2, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useIncomeStore } from "@/lib/stores/income-store";
import { useUserStore } from "@/lib/stores/user-store";
import { useToast } from "@/lib/hooks/use-toast";
import { sidePanelVariants, overlayVariants } from "@/lib/animations";
import { IncomeEntry } from "@/lib/types";
import { MagicCard } from "@/components/ui/magic-card";

interface EntryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

export function EntryPanel({ isOpen, onClose, selectedDate }: EntryPanelProps) {
  const { success, error } = useToast();
  const activeUserId = useUserStore((state) => state.activeUserId);
  const activeUser = useUserStore((state) => state.getActiveUser());
  const { addEntry, updateEntry, deleteEntry, getEntriesByDate } =
    useIncomeStore();

  const [formData, setFormData] = useState({
    projectName: "",
    amount: "",
    category: "airdrop" as "airdrop" | "trading" | "staking" | "other",
    notes: "",
    tradingCost: "", // Cost for trading category
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // Get entries for selected date
  const dateEntries =
    activeUserId && selectedDate
      ? getEntriesByDate(activeUserId, selectedDate)
      : [];

  const totalForDay = dateEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeUserId || !selectedDate) {
      error("Please select a user and date");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      error("Please enter a valid amount");
      return;
    }

    if (editingId) {
      // Update existing entry
      updateEntry(editingId, {
        projectName: formData.projectName,
        amount,
        category: formData.category,
        notes: formData.notes,
      });
      success("Entry updated successfully");
      setEditingId(null);
    } else {
      // Add new entry
      addEntry({
        userId: activeUserId,
        date: selectedDate,
        projectName: formData.projectName,
        amount,
        category: formData.category,
        notes: formData.notes,
      });
      success("Entry added successfully");
    }

    // Reset form
    setFormData({
      projectName: "",
      amount: "",
      category: "airdrop",
      notes: "",
      tradingCost: "",
    });
  };

  const handleEdit = (entry: IncomeEntry) => {
    setFormData({
      projectName: entry.projectName,
      amount: entry.amount.toString(),
      category: entry.category,
      notes: entry.notes || "",
      tradingCost: "",
    });
    setEditingId(entry.id);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntry(id);
      success("Entry deleted");
    }
  };

  const categoryColors = {
    airdrop: "bg-[#FFD700]/20 text-[#FFD700]",
    trading: "bg-[#00CED1]/20 text-[#00CED1]",
    staking: "bg-[#9B59B6]/20 text-[#9B59B6]",
    other: "bg-[#9CA3AF]/20 text-[#9CA3AF]",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            variants={sidePanelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] glass border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    Income Entries
                  </h2>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              {activeUser && (
                <MagicCard
                  className="rounded-lg p-4 mb-6 border-white/10"
                  gradientColor="rgba(251, 191, 36, 0.15)"
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center font-bold text-black">
                      {activeUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activeUser.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Today&apos;s Total: ${totalForDay.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </MagicCard>
              )}

              {/* Existing Entries */}
              {dateEntries.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Today&apos;s Entries ({dateEntries.length})
                  </h3>
                  <div className="space-y-2">
                    {dateEntries.map((entry) => (
                      <MagicCard
                        key={entry.id}
                        className="rounded-lg p-4 border-white/10"
                        gradientColor="rgba(255, 255, 255, 0.05)"
                      >
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{entry.projectName}</p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${categoryColors[entry.category]
                                  }`}
                              >
                                {entry.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 hover:bg-[#EF4444]/20 text-[#EF4444] rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-2xl font-bold gradient-text-gold">
                            ${entry.amount.toFixed(2)}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </MagicCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Edit Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editingId ? "Edit Entry" : "Add New Entry"}
                </h3>

                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData({ ...formData, projectName: e.target.value })
                    }
                    placeholder="e.g., Zeta Protocol"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as
                          | "airdrop"
                          | "trading"
                          | "staking"
                          | "other",
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="airdrop">Airdrop</option>
                    <option value="trading">Trading</option>
                    <option value="staking">Staking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 gradient-gold text-black font-medium rounded-lg hover:glow-gold transition-all"
                  >
                    {editingId ? "Update Entry" : "Add Entry"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          projectName: "",
                          amount: "",
                          category: "airdrop",
                          notes: "",
                          tradingCost: "",
                        });
                      }}
                      className="px-6 py-3 glass hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
