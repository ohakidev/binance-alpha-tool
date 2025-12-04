"use client";

/**
 * Settings Page - Redesigned with full i18n support
 * Modern settings management with language selection
 */

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Palette,
  Bell,
  Database,
  Download,
  Trash2,
  Key,
  Save,
  Upload,
  Eye,
  EyeOff,
  Globe,
  Settings as SettingsIcon,
  Shield,
  Monitor,
  Moon,
  Sun,
  Send,
} from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useLanguage } from "@/lib/stores/language-store";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MagicCard } from "@/components/ui/magic-card";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // API Keys State
  const [, setApiKey] = useState("");
  const [, setSecretKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [tempApiSecret, setTempApiSecret] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Telegram State
  const [, setTelegramToken] = useState("");
  const [, setTelegramChatId] = useState("");
  const [tempTelegramToken, setTempTelegramToken] = useState("");
  const [tempTelegramChatId, setTempTelegramChatId] = useState("");

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Get settings after mount to avoid hydration mismatch
  const app = useSettingsStore((state) => state.app);
  const updateAppSettings = useSettingsStore(
    (state) => state.updateAppSettings,
  );
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

  useEffect(() => {
    setMounted(true);
    // Load saved keys
    const savedApiKey = localStorage.getItem("binance_api_key") || "";
    const savedSecretKey = localStorage.getItem("binance_secret_key") || "";
    const savedTelegramToken = localStorage.getItem("telegram_bot_token") || "";
    const savedTelegramChatId = localStorage.getItem("telegram_chat_id") || "";

    setApiKey(savedApiKey);
    setSecretKey(savedSecretKey);
    setTempApiKey(savedApiKey);
    setTempApiSecret(savedSecretKey);

    setTelegramToken(savedTelegramToken);
    setTelegramChatId(savedTelegramChatId);
    setTempTelegramToken(savedTelegramToken);
    setTempTelegramChatId(savedTelegramChatId);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-32 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-primary/20" />

            {/* Tabs skeleton */}
            <div className="h-14 w-full bg-white/5 rounded-xl border border-white/10" />

            {/* Content skeleton */}
            <div className="space-y-4">
              <div className="h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20" />
              <div className="h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveApiKeys = () => {
    if (!tempApiKey || !tempApiSecret) {
      toast.error(t("common.error"));
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("binance_api_key", tempApiKey);
      localStorage.setItem("binance_secret_key", tempApiSecret);
      setApiKey(tempApiKey);
      setSecretKey(tempApiSecret);
      toast.success(t("common.success"));
      setIsSaving(false);
    }, 1000);
  };

  const handleSaveTelegram = () => {
    if (!tempTelegramToken || !tempTelegramChatId) {
      toast.error(t("common.error"));
      return;
    }
    localStorage.setItem("telegram_bot_token", tempTelegramToken);
    localStorage.setItem("telegram_chat_id", tempTelegramChatId);
    setTelegramToken(tempTelegramToken);
    setTelegramChatId(tempTelegramChatId);
    toast.success(t("common.success"));
  };

  const handleResetData = () => {
    resetToDefaults();
    toast.success(t("common.success"));
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/backup/export");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `binance-alpha-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const response = await fetch("/api/backup/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          toast.success(t("common.success"));
          window.location.reload();
        } else {
          toast.error(t("common.error"));
        }
      } catch {
        toast.error(t("common.error"));
      }
    };
    reader.readAsText(file);
  };

  const tabItems = [
    { value: "general", label: t("settings.general"), icon: SettingsIcon },
    { value: "api", label: t("settings.apiKeys"), icon: Key },
    { value: "notifications", label: t("settings.notifications"), icon: Bell },
    { value: "display", label: t("settings.display"), icon: Palette },
    { value: "data", label: t("settings.dataManagement"), icon: Database },
  ];

  return (
    <div
      key={`settings-${language}`}
      className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/10 p-8 border border-primary/20"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <SettingsIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                    {t("settings.title")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("settings.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          </motion.div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative z-50">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-white/5 p-2 rounded-xl mb-6">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-primary/30 rounded-lg transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <MagicCard
              className="rounded-xl border-white/10 overflow-hidden"
              gradientColor="rgba(251, 191, 36, 0.15)"
            >
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-500" />
                  {t("settings.language")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("settings.languageDesc")}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { code: "en", label: "English", flag: "🇺🇸" },
                    { code: "th", label: "ไทย", flag: "🇹🇭" },
                  ].map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLanguage(lang.code as "th" | "en")}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        language === lang.code
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <span
                          className={`font-medium ${
                            language === lang.code
                              ? "text-amber-500"
                              : "text-slate-300"
                          }`}
                        >
                          {lang.label}
                        </span>
                      </div>
                      {language === lang.code && (
                        <div className="absolute top-4 right-4 text-amber-500">
                          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-6">
            <MagicCard
              className="rounded-xl border-white/10 overflow-hidden"
              gradientColor="rgba(6, 182, 212, 0.15)"
            >
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-500" />
                  {t("settings.apiKeys")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("settings.apiKeysDesc")}
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Binance API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="w-full pl-10 pr-12 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="Enter your Binance API Key"
                      />
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Binance Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiSecret ? "text" : "password"}
                        value={tempApiSecret}
                        onChange={(e) => setTempApiSecret(e.target.value)}
                        className="w-full pl-10 pr-12 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="Enter your Binance Secret Key"
                      />
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <button
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showApiSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveApiKeys}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {t("common.save")}
                    </motion.button>
                  </div>
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <MagicCard
              className="rounded-xl border-white/10 overflow-hidden"
              gradientColor="rgba(168, 85, 247, 0.15)"
            >
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  {t("settings.notifications")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("settings.notificationsDesc")}
                </p>
              </div>
              <div className="p-6 space-y-6">
                {/* Telegram Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium text-slate-200">
                        Telegram Integration
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts directly to your Telegram
                      </p>
                    </div>
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Send className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Telegram Bot Token
                    </label>
                    <input
                      type="password"
                      value={tempTelegramToken}
                      onChange={(e) => setTempTelegramToken(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      placeholder="Enter Bot Token"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      value={tempTelegramChatId}
                      onChange={(e) => setTempTelegramChatId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      placeholder="Enter Chat ID"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveTelegram}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {t("common.save")}
                    </motion.button>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Notification Toggles */}
                <div className="space-y-4">
                  {[
                    {
                      id: "price-alerts",
                      label: "Price Alerts",
                      desc: "Get notified when price moves significantly",
                    },
                    {
                      id: "stability-alerts",
                      label: "Stability Alerts",
                      desc: "Alerts for stability score changes",
                    },
                    {
                      id: "new-listings",
                      label: "New Listings",
                      desc: "Notification for new token listings",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-slate-200">
                          {item.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      <Switch
                        defaultChecked
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6">
            <MagicCard
              className="rounded-xl border-white/10 overflow-hidden"
              gradientColor="rgba(244, 63, 94, 0.15)"
            >
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-rose-500" />
                  {t("settings.display")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("settings.displayDesc")}
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-200">
                      {t("settings.theme")}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.themeDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => updateAppSettings({ theme: "light" })}
                      className={`p-2 rounded-md transition-all ${
                        app.theme === "light"
                          ? "bg-white text-black shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateAppSettings({ theme: "dark" })}
                      className={`p-2 rounded-md transition-all ${
                        app.theme === "dark"
                          ? "bg-slate-700 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateAppSettings({ theme: "auto" })}
                      className={`p-2 rounded-md transition-all ${
                        app.theme === "auto"
                          ? "bg-blue-500/20 text-blue-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-200">
                      Compact Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Reduce spacing and font size
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-200">
                      Animations
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enable UI animations and effects
                    </p>
                  </div>
                  <Switch
                    defaultChecked
                    className="data-[state=checked]:bg-rose-500"
                  />
                </div>
              </div>
            </MagicCard>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <MagicCard
              className="rounded-xl border-white/10 overflow-hidden"
              gradientColor="rgba(16, 185, 129, 0.15)"
            >
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  {t("settings.dataManagement")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("settings.dataManagementDesc")}
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-400" />
                      Export Data
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download all your data as a JSON file backup.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleExportData}
                      className="w-full py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      Export JSON
                    </motion.button>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      Import Data
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Restore your data from a JSON backup file.
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        Select File
                      </motion.button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-red-400">
                    <Trash2 className="w-4 h-4" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete all your data. This action cannot be
                    undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        Reset All Data
                      </motion.button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-premium border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete all your data including settings, API keys, and
                          income entries.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetData}
                          className="bg-red-500 hover:bg-red-600 text-white border-none"
                        >
                          Yes, delete everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </MagicCard>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
