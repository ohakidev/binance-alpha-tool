"use client";

/**
 * User Modal Component
 * Add/Edit user with avatar selection and validation
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, User as UserIcon, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/stores/user-store";
import { modalVariants, fadeVariants } from "@/lib/animations";
import { useUIStore } from "@/lib/stores/ui-store";
import { useLanguage } from "@/lib/stores/language-store";
import { userManagementCopy } from "@/lib/i18n/route-copy";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

// Preset avatar options
const avatarPresets = [
  { emoji: "👤", color: "from-[#FFD700] to-[#FFA500]" }, // Gold
  { emoji: "⭐", color: "from-[#00CED1] to-[#4FD5D7]" }, // Cyan
  { emoji: "🎮", color: "from-[#9B59B6] to-[#B985C5]" }, // Purple
  { emoji: "💎", color: "from-[#10B981] to-[#059669]" }, // Green
  { emoji: "🔥", color: "from-[#F59E0B] to-[#D97706]" }, // Orange
  { emoji: "⚡", color: "from-[#EF4444] to-[#DC2626]" }, // Red
  { emoji: "🌙", color: "from-[#667eea] to-[#764ba2]" }, // Game gradient
  { emoji: "🎯", color: "from-[#FFD700] to-[#00CED1]" }, // Gold-Cyan
];

export function UserModal({ isOpen, onClose, userId }: UserModalProps) {
  const { language, t } = useLanguage();
  const copy = userManagementCopy[language];
  const { users, addUser, updateUser } = useUserStore();
  const addToast = useUIStore((state) => state.addToast);

  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [errors, setErrors] = useState<{ username?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!userId;
  const editingUser = isEdit ? users.find((u) => u.id === userId) : null;

  // Populate form when editing
  useEffect(() => {
    if (isEdit && editingUser) {
      setUsername(editingUser.username);
      // Find avatar index or default to 0
      const avatarIndex = avatarPresets.findIndex(
        (a) => a.emoji === editingUser.username.charAt(0)
      );
      setSelectedAvatar(avatarIndex >= 0 ? avatarIndex : 0);
    } else {
      setUsername("");
      setSelectedAvatar(0);
    }
    setErrors({});
  }, [isEdit, editingUser, isOpen]);

  const validateForm = () => {
    const newErrors: { username?: string } = {};

    if (!username.trim()) {
      newErrors.username = copy.usernameRequired;
    } else if (username.trim().length < 2) {
      newErrors.username = copy.usernameMinLength;
    } else if (username.trim().length > 20) {
      newErrors.username = copy.usernameMaxLength;
    } else {
      // Check for duplicate username (excluding current user when editing)
      const duplicate = users.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.id !== userId
      );
      if (duplicate) {
        newErrors.username = copy.usernameAlreadyExists;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEdit && userId) {
        updateUser(userId, {
          username: username.trim(),
        });
        addToast({
          type: "success",
          title: t("common.success"),
          description: copy.userUpdated,
        });
        addToast({
          type: "success",
          title: t("common.success"),
          description: copy.userUpdated,
        });
      } else {
        addUser({
          username: username.trim(),
          totalEarnings: 0,
          entryCount: 0,
          balance: 0,
        });
        addToast({
          type: "success",
          title: t("common.success"),
          description: copy.userCreated,
        });
      }

      onClose();
    } catch {
      addToast({
        type: "error",
        title: t("common.error"),
        description: copy.saveUserFailed,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text-gold">
                  {isEdit ? copy.editUser : copy.addNewUser}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    {copy.selectAvatar}
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {avatarPresets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAvatar(index)}
                        className={`
                          relative aspect-square rounded-xl
                          bg-gradient-to-br ${preset.color}
                          flex items-center justify-center text-2xl
                          transition-all duration-200
                          ${
                            selectedAvatar === index
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                              : "hover:scale-105 opacity-70 hover:opacity-100"
                          }
                        `}
                      >
                        {preset.emoji}
                        {selectedAvatar === index && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-gold flex items-center justify-center text-black text-xs font-bold"
                          >
                            ✓
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-2"
                  >
                    {copy.username}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) {
                          setErrors({});
                        }
                      }}
                      className={`
                        w-full pl-10 pr-4 py-2.5 rounded-lg glass
                        border transition-colors
                        focus:outline-none focus:ring-2 focus:ring-primary
                        ${
                          errors.username
                            ? "border-destructive"
                            : "border-white/20"
                        }
                      `}
                      placeholder={copy.enterUsername}
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-sm mt-1"
                    >
                      {errors.username}
                    </motion.p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {username.length}/20 {copy.characters}
                  </p>
                </div>

                {/* Preview */}
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-3">{copy.preview}</p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-16 h-16 rounded-full
                        bg-gradient-to-br ${avatarPresets[selectedAvatar].color}
                        flex items-center justify-center text-2xl
                        shadow-lg
                      `}
                    >
                      {avatarPresets[selectedAvatar].emoji}
                    </div>
                    <div>
                      <p className="font-bold">
                        {username.trim() || copy.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isEdit
                          ? `Lv ${
                              Math.floor((editingUser?.entryCount || 0) / 10) +
                              1
                            }`
                          : `${copy.level} 1`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg glass hover:bg-white/20 transition-colors font-medium"
                  >
                    {copy.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-lg gradient-gold text-black font-medium hover:glow-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                        />
                        {copy.saving}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEdit ? copy.update : copy.create}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
