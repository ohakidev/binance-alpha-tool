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
  RefreshCw,
  Save,
  Upload,
  Eye,
  EyeOff,
  Globe,
  Settings as SettingsIcon,
  Shield,
  Volume2,
  Monitor,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useLanguage } from "@/lib/stores/language-store";
import { toast } from "sonner";
import { containerVariants, cardVariants } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  // Get settings after mount to avoid hydration mismatch
  const app = useSettingsStore((state) => state.app);
  const notifications = useSettingsStore((state) => state.notifications);
  const updateAppSettings = useSettingsStore(
    (state) => state.updateAppSettings,
  );
  const updateNotificationSettings = useSettingsStore(
    (state) => state.updateNotificationSettings,
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
    setTelegramToken(savedTelegramToken);
    setTelegramChatId(savedTelegramChatId);
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
    if (!apiKey || !secretKey) {
      toast.error(t("common.error"));
      return;
    }
    localStorage.setItem("binance_api_key", apiKey);
    localStorage.setItem("binance_secret_key", secretKey);
    toast.success(t("common.success"));
  };

  const handleSaveTelegram = () => {
    if (!telegramToken || !telegramChatId) {
      toast.error(t("common.error"));
      return;
    }
    localStorage.setItem("telegram_bot_token", telegramToken);
    localStorage.setItem("telegram_chat_id", telegramChatId);
    toast.success(t("common.success"));
  };

  const handleReset = () => {
    resetToDefaults();
    toast.success(t("common.success"));
  };

  const handleExport = async () => {
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleClearCache = async () => {
    try {
      localStorage.clear();
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      toast.success(t("common.success"));
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleLanguageChange = (lang: "th" | "en") => {
    setLanguage(lang);
    // Show success message in the new language
    setTimeout(() => {
      toast.success(
        lang === "th" ? "เปลี่ยนภาษาสำเร็จ" : "Language changed successfully",
      );
    }, 100);
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

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Language Selection */}
              <motion.div variants={cardVariants}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.language")}</CardTitle>
                        <CardDescription>
                          {t("settings.languageDesc")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLanguageChange("th")}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          language === "th"
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">🇹🇭</span>
                          <div className="text-left">
                            <p className="font-semibold">ไทย</p>
                            <p className="text-sm text-muted-foreground">
                              Thai Language
                            </p>
                          </div>
                          {language === "th" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLanguageChange("en")}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          language === "en"
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">🇬🇧</span>
                          <div className="text-left">
                            <p className="font-semibold">English</p>
                            <p className="text-sm text-muted-foreground">
                              English Language
                            </p>
                          </div>
                          {language === "en" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* About Section */}
              <motion.div variants={cardVariants}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.about")}</CardTitle>
                        <CardDescription>
                          {t("settings.aboutDesc")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                        <span className="text-muted-foreground">
                          {t("settings.version")}
                        </span>
                        <Badge variant="secondary">v1.0.0</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                        <span className="text-muted-foreground">
                          {t("settings.developer")}
                        </span>
                        <span className="font-medium">Binance Alpha Tool</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <motion.div variants={cardVariants}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Key className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.apiKeys")}</CardTitle>
                        <CardDescription>
                          {t("settings.apiKeysDesc")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="apiKey">{t("settings.apiKey")}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          placeholder={t("settings.apiKey")}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="flex-1 bg-white/5 border-white/10"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="bg-white/5 border-white/10"
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secretKey">
                        {t("settings.secretKey")}
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="secretKey"
                          type={showSecretKey ? "text" : "password"}
                          placeholder={t("settings.secretKey")}
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          className="flex-1 bg-white/5 border-white/10"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="bg-white/5 border-white/10"
                        >
                          {showSecretKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveApiKeys}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t("settings.saveApiKeys")}
                    </Button>

                    <p className="text-xs text-muted-foreground mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      {t("settings.apiKeysWarning")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Telegram Settings */}
              <motion.div variants={cardVariants}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.telegram")}</CardTitle>
                        <CardDescription>
                          {t("settings.telegramDesc")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="telegramToken">
                        {t("settings.botToken")}
                      </Label>
                      <Input
                        id="telegramToken"
                        type="text"
                        placeholder="xxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="mt-1 bg-white/5 border-white/10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="telegramChatId">
                        {t("settings.chatId")}
                      </Label>
                      <Input
                        id="telegramChatId"
                        type="text"
                        placeholder="123456789"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="mt-1 bg-white/5 border-white/10"
                      />
                    </div>

                    <Button
                      onClick={handleSaveTelegram}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t("settings.saveTelegram")}
                    </Button>

                    <Separator className="my-4 bg-white/10" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <Label htmlFor="airdrop-alerts">
                            {t("settings.airdropAlerts")}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.airdropAlertsDesc")}
                          </p>
                        </div>
                        <Switch
                          id="airdrop-alerts"
                          checked={notifications.airdropAlerts}
                          onCheckedChange={(checked) =>
                            updateNotificationSettings({
                              airdropAlerts: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <Label
                            htmlFor="sound-effects"
                            className="flex items-center gap-2"
                          >
                            <Volume2 className="w-4 h-4" />
                            {t("settings.soundEffects")}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.soundEffectsDesc")}
                          </p>
                        </div>
                        <Switch
                          id="sound-effects"
                          checked={notifications.soundEffects}
                          onCheckedChange={(checked) =>
                            updateNotificationSettings({
                              soundEffects: checked,
                            })
                          }
                        />
                      </div>

                      {notifications.soundEffects && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 rounded-lg bg-white/5"
                        >
                          <div className="flex justify-between mb-2">
                            <Label>{t("settings.volume")}</Label>
                            <span className="text-sm text-muted-foreground">
                              {notifications.volume}%
                            </span>
                          </div>
                          <Slider
                            value={[notifications.volume]}
                            onValueChange={([value]) =>
                              updateNotificationSettings({ volume: value })
                            }
                            max={100}
                            step={10}
                            className="w-full"
                          />
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <motion.div variants={cardVariants}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.display")}</CardTitle>
                        <CardDescription>
                          {t("settings.displayDesc")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <Label className="mb-3 block">
                        {t("settings.theme")}
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            value: "dark",
                            icon: Moon,
                            label: t("common.dark"),
                          },
                          {
                            value: "light",
                            icon: Sun,
                            label: t("common.light"),
                          },
                          {
                            value: "auto",
                            icon: Monitor,
                            label: t("common.system"),
                          },
                        ].map((theme) => (
                          <motion.button
                            key={theme.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              updateAppSettings({
                                theme: theme.value as "dark" | "light" | "auto",
                              })
                            }
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                              app.theme === theme.value
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <theme.icon className="w-6 h-6" />
                              <span className="text-sm font-medium">
                                {theme.label}
                              </span>
                            </div>
                            {app.theme === theme.value && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2"
                              >
                                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Refresh Interval */}
                    <div>
                      <Label htmlFor="refresh">
                        {t("settings.refreshInterval")}
                      </Label>
                      <Select
                        value={app.refreshInterval.toString()}
                        onValueChange={(value) =>
                          updateAppSettings({
                            refreshInterval: parseInt(value) as
                              | 10
                              | 15
                              | 30
                              | 60,
                          })
                        }
                      >
                        <SelectTrigger
                          id="refresh"
                          className="mt-2 bg-white/5 border-white/10"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">
                            {t("settings.refresh10")}
                          </SelectItem>
                          <SelectItem value="15">
                            {t("settings.refresh15")}
                          </SelectItem>
                          <SelectItem value="30">
                            {t("settings.refresh30")}
                          </SelectItem>
                          <SelectItem value="60">
                            {t("settings.refresh60")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              <motion.div variants={cardVariants}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <Database className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.dataManagement")}</CardTitle>
                        <CardDescription>
                          {t("settings.dataManagementDesc")}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={handleExport}
                        variant="outline"
                        className="w-full bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t("settings.exportData")}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t("settings.importData")}
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full bg-white/5 border-white/10 hover:bg-white/10"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t("settings.resetSettings")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("settings.confirmReset")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("settings.confirmResetDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10">
                              {t("common.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleReset}
                              className="bg-amber-500 hover:bg-amber-600"
                            >
                              {t("common.confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("settings.clearCache")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("settings.confirmClear")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("settings.confirmClearDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10">
                              {t("common.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleClearCache}
                              className="bg-rose-500 hover:bg-rose-600"
                            >
                              {t("common.confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
