"use client";

/**
 * Backup & Restore Wizard
 * Multi-step wizard for data backup and restore
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  Check,
  AlertCircle,
  FileJson,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/user-store";
import { useIncomeStore } from "@/lib/stores/income-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useUIStore } from "@/lib/stores/ui-store";
import {
  createBackup,
  downloadBackup,
  readBackupFile,
  compareBackup,
  formatFileSize,
  exportToCSV,
  type BackupData,
} from "@/lib/backup";

type WizardStep = "select" | "preview" | "confirm" | "complete";
type BackupMode = "backup" | "restore";

interface BackupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupWizard({ isOpen, onClose }: BackupWizardProps) {
  const [mode, setMode] = useState<BackupMode>("backup");
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedData, setSelectedData] = useState({
    users: true,
    entries: true,
    settings: true,
  });
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const users = useUserStore((state) => state.users);
  const entries = useIncomeStore((state) => state.entries);
  const settings = useSettingsStore((state) => state);
  const addToast = useUIStore((state) => state.addToast);

  const handleBackup = () => {
    setIsProcessing(true);

    try {
      const backup = createBackup(
        selectedData.users ? users : [],
        selectedData.entries ? entries : [],
        selectedData.settings ? settings : undefined
      );

      setBackupData(backup);
      setStep("preview");
      addToast({
        type: "success",
        title: "Success",
        description: "Backup created successfully",
      });
    } catch {
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to create backup",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!backupData) return;

    try {
      downloadBackup(backupData);
      setStep("complete");
      addToast({
        type: "success",
        title: "Success",
        description: "Backup downloaded successfully",
      });
    } catch {
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to download backup",
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);

    try {
      const backup = await readBackupFile(file);
      setBackupData(backup);
      setStep("preview");
      addToast({
        type: "success",
        title: "Success",
        description: "Backup file loaded successfully",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to read backup file",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = () => {
    if (!backupData) return;

    setIsProcessing(true);

    try {
      // Restore data
      if (selectedData.users && backupData.data.users) {
        const restoreUsers = useUserStore.getState().restoreUsers;
        restoreUsers(backupData.data.users);
      }

      if (selectedData.entries && backupData.data.entries) {
        const restoreEntries = useIncomeStore.getState().restoreEntries;
        restoreEntries(backupData.data.entries);
      }

      if (selectedData.settings && backupData.data.settings) {
        const updateAppSettings = useSettingsStore.getState().updateAppSettings;
        updateAppSettings(backupData.data.settings);
      }

      setStep("complete");
      addToast({
        type: "success",
        title: "Success",
        description: "Data restored successfully",
      });

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to restore data",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(entries);
      addToast({
        type: "success",
        title: "Success",
        description: "CSV exported successfully",
      });
    } catch {
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to export CSV",
      });
    }
  };

  const resetWizard = () => {
    setStep("select");
    setMode("backup");
    setSelectedData({ users: true, entries: true, settings: true });
    setBackupData(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const diff = backupData ? compareBackup(backupData, users, entries) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Wizard Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h2 className="text-2xl font-bold gradient-text-gold">
                  {mode === "backup" ? "Backup Data" : "Restore Data"}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Step Indicator */}
              {step !== "select" && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {["select", "preview", "confirm", "complete"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          step === s
                            ? "gradient-gold text-black"
                            : [
                                "select",
                                "preview",
                                "confirm",
                                "complete",
                              ].indexOf(step) >
                              [
                                "select",
                                "preview",
                                "confirm",
                                "complete",
                              ].indexOf(s)
                            ? "bg-[#10B981] text-white"
                            : "glass"
                        }`}
                      >
                        {["select", "preview", "confirm", "complete"].indexOf(
                          step
                        ) >
                        ["select", "preview", "confirm", "complete"].indexOf(
                          s
                        ) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < 3 && <div className="w-12 h-0.5 bg-white/20" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Content */}
              <AnimatePresence mode="wait">
                {/* Step 1: Select Mode & Data */}
                {step === "select" && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => setMode("backup")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          mode === "backup"
                            ? "border-primary bg-primary/10"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        <Download className="w-8 h-8 mx-auto mb-3 text-primary" />
                        <h3 className="font-bold mb-1">Backup</h3>
                        <p className="text-sm text-muted-foreground">
                          Export your data to a file
                        </p>
                      </button>

                      <button
                        onClick={() => setMode("restore")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          mode === "restore"
                            ? "border-secondary bg-secondary/10"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        <Upload className="w-8 h-8 mx-auto mb-3 text-secondary" />
                        <h3 className="font-bold mb-1">Restore</h3>
                        <p className="text-sm text-muted-foreground">
                          Import data from a backup file
                        </p>
                      </button>
                    </div>

                    {/* Data Selection */}
                    {mode === "backup" && (
                      <>
                        <h3 className="font-bold mb-3">
                          Select Data to Backup
                        </h3>
                        <div className="space-y-3 mb-6">
                          {[
                            {
                              key: "users",
                              label: "Users",
                              count: users.length,
                            },
                            {
                              key: "entries",
                              label: "Income Entries",
                              count: entries.length,
                            },
                            {
                              key: "settings",
                              label: "App Settings",
                              count: 1,
                            },
                          ].map((item) => (
                            <label
                              key={item.key}
                              className="flex items-center gap-3 p-4 glass rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedData[
                                    item.key as keyof typeof selectedData
                                  ]
                                }
                                onChange={(e) =>
                                  setSelectedData({
                                    ...selectedData,
                                    [item.key]: e.target.checked,
                                  })
                                }
                                className="w-5 h-5"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.count}{" "}
                                  {item.count === 1 ? "item" : "items"}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleBackup}
                            disabled={
                              isProcessing ||
                              !Object.values(selectedData).some((v) => v)
                            }
                            className="flex-1 px-4 py-3 gradient-gold text-black font-medium rounded-lg hover:glow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Create Backup
                          </button>
                          <button
                            onClick={handleExportCSV}
                            disabled={entries.length === 0}
                            className="px-4 py-3 glass rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            <FileText className="w-4 h-4" />
                            Export CSV
                          </button>
                        </div>
                      </>
                    )}

                    {/* File Upload for Restore */}
                    {mode === "restore" && (
                      <div>
                        <label className="block p-8 border-2 border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-white/40 transition-colors">
                          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="font-medium mb-1">
                            Drop backup file here
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">
                            or click to browse
                          </p>
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            className="hidden"
                          />
                          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm">
                            <FileJson className="w-4 h-4" />
                            Select JSON File
                          </div>
                        </label>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Preview */}
                {step === "preview" && backupData && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="font-bold mb-4">Backup Preview</h3>

                    <div className="glass rounded-lg p-4 mb-6 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">
                          {backupData.version}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">
                          {new Date(backupData.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-medium">
                          {formatFileSize(backupData.metadata.estimatedSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Users</span>
                        <span className="font-medium">
                          {backupData.metadata.totalUsers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entries</span>
                        <span className="font-medium">
                          {backupData.metadata.totalEntries}
                        </span>
                      </div>
                    </div>

                    {mode === "restore" && diff && (
                      <div className="glass rounded-lg p-4 mb-6">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                          Changes Preview
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>New Users</span>
                            <span className="text-[#10B981]">
                              +{diff.usersDiff.added}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>New Entries</span>
                            <span className="text-[#10B981]">
                              +{diff.entriesDiff.added}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep("select")}
                        className="px-4 py-3 glass rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button
                        onClick={() =>
                          mode === "backup"
                            ? handleDownload()
                            : setStep("confirm")
                        }
                        className="flex-1 px-4 py-3 gradient-gold text-black font-medium rounded-lg hover:glow-gold transition-all"
                      >
                        {mode === "backup" ? "Download" : "Continue"}
                        <ChevronRight className="w-4 h-4 inline ml-2" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Confirm (Restore only) */}
                {step === "confirm" && mode === "restore" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="text-center mb-6">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#F59E0B]" />
                      <h3 className="text-xl font-bold mb-2">
                        Confirm Restore
                      </h3>
                      <p className="text-muted-foreground">
                        This will replace your current data with the backup.
                        <br />
                        This action cannot be undone.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep("preview")}
                        className="flex-1 px-4 py-3 glass rounded-lg hover:bg-white/20 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRestore}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 bg-[#EF4444] text-white font-medium rounded-lg hover:bg-[#DC2626] transition-all disabled:opacity-50"
                      >
                        {isProcessing ? "Restoring..." : "Confirm Restore"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Complete */}
                {step === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-20 h-20 mx-auto mb-4 rounded-full gradient-gold flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-black" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">
                      {mode === "backup"
                        ? "Backup Complete!"
                        : "Restore Complete!"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {mode === "backup"
                        ? "Your data has been exported successfully"
                        : "Your data has been restored. The page will reload shortly."}
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 gradient-gold text-black font-medium rounded-lg hover:glow-gold transition-all"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
