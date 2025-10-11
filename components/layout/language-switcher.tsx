"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/stores/language-store";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "th" as const, label: "ไทย", flag: "🇹🇭" },
    { code: "en" as const, label: "English", flag: "🇬🇧" },
  ];

  const handleLanguageChange = (code: "th" | "en") => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      >
        <Languages className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">
          {languages.find((l) => l.code === language)?.flag}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                    language === lang.code
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-l-2 border-amber-500"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-amber-400"
                    >
                      ✓
                    </motion.span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
