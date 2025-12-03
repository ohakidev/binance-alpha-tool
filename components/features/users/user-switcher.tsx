"use client";

/**
 * User Switcher Component
 * Character selection-style user carousel
 */

import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/user-store";
import { format } from "date-fns";
import { cardVariants } from "@/lib/animations";

interface UserSwitcherProps {
  onAddUser: () => void;
  onEditUser: (userId: string) => void;
}

export function UserSwitcher({ onAddUser, onEditUser }: UserSwitcherProps) {
  const { users, activeUserId, setActiveUser, removeUser } = useUserStore();
  const [showActions, setShowActions] = useState<string | null>(null);

  const handleDelete = (userId: string, username: string) => {
    if (users.length <= 1) {
      alert("Cannot delete the last user");
      return;
    }

    if (confirm(`Are you sure you want to delete ${username}?`)) {
      removeUser(userId);
    }
  };

  // Avatar colors based on user
  const avatarColors = [
    "from-[#FFD700] to-[#FFA500]", // Gold
    "from-[#00CED1] to-[#4FD5D7]", // Cyan
    "from-[#9B59B6] to-[#B985C5]", // Purple
    "from-[#10B981] to-[#059669]", // Green
    "from-[#F59E0B] to-[#D97706]", // Orange
    "from-[#EF4444] to-[#DC2626]", // Red
  ];

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Select User</h3>
        <button
          onClick={onAddUser}
          className="px-3 py-1.5 gradient-gold text-black rounded-lg hover:glow-gold transition-all flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {users.map((user, index) => {
          const isActive = user.id === activeUserId;
          const colorIndex = index % avatarColors.length;

          return (
            <motion.div
              key={user.id}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              className="relative"
              onMouseEnter={() => setShowActions(user.id)}
              onMouseLeave={() => setShowActions(null)}
            >
              <div
                onClick={() => setActiveUser(user.id)}
                className={`
                  relative overflow-hidden rounded-xl p-4 cursor-pointer
                  transition-all duration-300
                  ${
                    isActive
                      ? "border-2 border-primary glow-gold glass"
                      : "border-2 border-transparent glass hover:border-white/20"
                  }
                `}
              >
                {/* Active Badge */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full gradient-gold flex items-center justify-center text-black text-xs font-bold"
                  >
                    ✓
                  </motion.div>
                )}

                {/* Avatar */}
                <div className="flex flex-col items-center mb-3">
                  <div
                    className={`
                      w-20 h-20 rounded-full bg-gradient-to-br ${avatarColors[colorIndex]}
                      flex items-center justify-center text-3xl font-bold text-black
                      mb-2 shadow-lg
                      ${isActive ? "animate-pulse-glow" : ""}
                    `}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Level Badge */}
                  <div className="px-2 py-0.5 rounded-full glass text-xs font-medium">
                    Lv {Math.floor(user.entryCount / 10) + 1}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center">
                  <p className="font-bold text-sm mb-1 truncate">
                    {user.username}
                  </p>
                  <p className="text-2xl font-bold gradient-text-gold mb-1">
                    ${user.totalEarnings.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.entryCount} entries
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(user.lastActive, "MMM d")}
                  </p>
                </div>

                {/* Action Buttons */}
                {showActions === user.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditUser(user.id);
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.id, user.username);
                      }}
                      className="p-2 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Click on a user card to switch active user
      </p>
    </div>
  );
}
