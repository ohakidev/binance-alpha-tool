"use client";

/**
 * Settings Page with i18n
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
import { Card } from "@/components/ui/card";
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
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  // Get settings after mount to avoid hydration mismatch
  const app = useSettingsStore((state) => state.app);
  const notifications = useSettingsStore((state) => state.notifications);
  const updateAppSettings = useSettingsStore((state) => state.updateAppSettings);
  const updateNotificationSettings = useSettingsStore((state) => state.updateNotificationSettings);
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            {t("settings.title")}
          </span>
        </h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* API Keys */}
        <motion.div variants={cardVariants}>
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("settings.apiKeys")}</h2>
                <p className="text-sm text-muted-foreground">{t("settings.apiKeysDesc")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">{t("settings.apiKey")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder={t("settings.apiKey")}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="secretKey">{t("settings.secretKey")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="secretKey"
                    type={showSecretKey ? "text" : "password"}
                    placeholder={t("settings.secretKey")}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveApiKeys} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {t("settings.saveApiKeys")}
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                {t("settings.apiKeysWarning")}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Telegram */}
        <motion.div variants={cardVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("settings.telegram")}</h2>
                <p className="text-sm text-muted-foreground">{t("settings.telegramDesc")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="telegramToken">{t("settings.botToken")}</Label>
                <Input
                  id="telegramToken"
                  type="text"
                  placeholder="xxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="telegramChatId">{t("settings.chatId")}</Label>
                <Input
                  id="telegramChatId"
                  type="text"
                  placeholder="123456789"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleSaveTelegram} variant="outline" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {t("settings.saveTelegram")}
              </Button>

              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="airdrop-alerts">{t("settings.airdropAlerts")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.airdropAlertsDesc")}
                    </p>
                  </div>
                  <Switch
                    id="airdrop-alerts"
                    checked={notifications.airdropAlerts}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ airdropAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-effects">{t("settings.soundEffects")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.soundEffectsDesc")}
                    </p>
                  </div>
                  <Switch
                    id="sound-effects"
                    checked={notifications.soundEffects}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ soundEffects: checked })
                    }
                  />
                </div>

                {notifications.soundEffects && (
                  <div>
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
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Display */}
        <motion.div variants={cardVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Palette className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("settings.display")}</h2>
                <p className="text-sm text-muted-foreground">{t("settings.displayDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme">{t("settings.theme")}</Label>
                <Select
                  value={app.theme}
                  onValueChange={(value: "dark" | "light" | "auto") =>
                    updateAppSettings({ theme: value })
                  }
                >
                  <SelectTrigger id="theme" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                    <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                    <SelectItem value="auto">{t("settings.themeAuto")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="refresh">{t("settings.refreshInterval")}</Label>
                <Select
                  value={app.refreshInterval.toString()}
                  onValueChange={(value) =>
                    updateAppSettings({
                      refreshInterval: parseInt(value) as 10 | 15 | 30 | 60,
                    })
                  }
                >
                  <SelectTrigger id="refresh" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">{t("settings.refresh10")}</SelectItem>
                    <SelectItem value="15">{t("settings.refresh15")}</SelectItem>
                    <SelectItem value="30">{t("settings.refresh30")}</SelectItem>
                    <SelectItem value="60">{t("settings.refresh60")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div variants={cardVariants}>
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("settings.dataManagement")}</h2>
                <p className="text-sm text-muted-foreground">{t("settings.dataManagementDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                {t("settings.exportData")}
              </Button>

              <Button variant="outline" className="w-full relative overflow-hidden">
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
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t("settings.resetSettings")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("settings.confirmReset")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.confirmResetDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
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
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("settings.confirmClear")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.confirmClearDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCache}>
                      {t("common.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
