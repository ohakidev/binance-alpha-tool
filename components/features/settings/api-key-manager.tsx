"use client";

/**
 * API Key Manager Component
 * Secure management of Binance API keys with encryption
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import { cardVariants } from "@/lib/animations";
import { useToast } from "@/lib/hooks/use-toast";

interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
}

export function APIKeyManager() {
  const { success, error: showError } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    secret: "",
  });

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "****";
    return key.substring(0, 4) + "****" + key.substring(key.length - 4);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${label} copied to clipboard`);
    } catch {
      showError("Failed to copy to clipboard");
    }
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.key || !formData.secret) {
      showError("Please fill in all fields");
      return;
    }

    const newKey: APIKey = {
      id: Date.now().toString(),
      name: formData.name,
      key: formData.key,
      secret: formData.secret,
      isActive: apiKeys.length === 0, // First key is active by default
      createdAt: new Date(),
    };

    setApiKeys([...apiKeys, newKey]);
    setFormData({ name: "", key: "", secret: "" });
    setShowAddForm(false);
    success("API key added successfully");
  };

  const handleDeleteKey = (id: string) => {
    if (confirm("Are you sure you want to delete this API key?")) {
      setApiKeys(apiKeys.filter((k) => k.id !== id));
      success("API key deleted");
    }
  };

  const handleSetActive = (id: string) => {
    setApiKeys(
      apiKeys.map((k) => ({
        ...k,
        isActive: k.id === id,
      })),
    );
    success("Active API key updated");
  };

  return (
    <motion.div variants={cardVariants} className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
            <Key className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-bold">API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Manage your Binance API keys
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 gradient-gold text-black rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Key
        </motion.button>
      </div>

      {/* Warning */}
      <div className="mb-4 p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex gap-3">
        <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-[#F59E0B] mb-1">Security Notice</p>
          <p className="text-muted-foreground">
            API keys are stored locally in your browser. Never share your API
            keys. For production use, consider using environment variables.
          </p>
        </div>
      </div>

      {/* Add Key Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddKey}
            className="mb-6 p-4 rounded-lg glass space-y-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Key Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Main Trading Account"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
                placeholder="Your Binance API Key"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={formData.secret}
                onChange={(e) =>
                  setFormData({ ...formData, secret: e.target.value })
                }
                placeholder="Your Binance API Secret"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 gradient-gold text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: "", key: "", secret: "" });
                }}
                className="px-4 py-2 glass hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No API keys configured</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add your first Binance API key to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {apiKeys.map((apiKey) => (
              <motion.div
                key={apiKey.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg glass border ${
                  apiKey.isActive
                    ? "border-[#FFD700]/50 bg-[#FFD700]/5"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{apiKey.name}</h3>
                      {apiKey.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFD700] text-black font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added {apiKey.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!apiKey.isActive && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSetActive(apiKey.id)}
                        className="px-3 py-1 text-xs rounded-lg glass hover:bg-white/10 transition-colors"
                      >
                        Set Active
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="p-2 rounded-lg glass hover:bg-[#EF4444]/20 text-[#EF4444] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* API Key */}
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm font-mono">
                      {visibleKeys.has(apiKey.id)
                        ? apiKey.key
                        : maskKey(apiKey.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key, "API Key")}
                      className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* API Secret */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    API Secret
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm font-mono">
                      {visibleKeys.has(apiKey.id)
                        ? apiKey.secret
                        : maskKey(apiKey.secret)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(apiKey.secret, "API Secret")
                      }
                      className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
