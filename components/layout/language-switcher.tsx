"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown, Languages } from "lucide-react";
import { useLanguage } from "@/lib/stores/language-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Language {
  code: "th" | "en";
  label: string;
  nativeLabel: string;
  flag: string;
}

const languages: Language[] = [
  { code: "th", label: "Thai", nativeLabel: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = (code: "th" | "en") => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
      >
        <Globe className="w-4 h-4 text-slate-400 animate-pulse" />
        <span className="text-sm">...</span>
      </Button>
    );
  }

  const currentLanguage = languages.find((l) => l.code === language);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group shadow-lg shadow-black/10"
        >
          <Languages className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline text-sm font-medium text-slate-200">
            {currentLanguage?.nativeLabel}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-64 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-cyan-500/10 rounded-2xl"
            asChild
            forceMount
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="px-2 py-2 mb-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    {t("settings.language")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {languages.map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`relative flex items-center gap-3 px-4 py-4 cursor-pointer rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-500/30"
                          : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
                      }`}
                    >
                      <span className="text-3xl">{lang.flag}</span>

                      <div className="flex-1">
                        <p className="font-semibold text-base">
                          {lang.nativeLabel}
                        </p>
                        <p className="text-xs text-slate-500">{lang.label}</p>
                      </div>

                      {isActive && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-l-xl" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="px-2 py-1 text-xs text-slate-500 text-center">
                  {language === "th"
                    ? "✨ เปลี่ยนภาษาได้ทุกเมื่อ"
                    : "✨ Change language anytime"}
                </p>
              </div>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}

// Compact version for mobile or tight spaces
export function LanguageSwitcherCompact() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleLanguage = () => {
    const newLang = language === "th" ? "en" : "th";
    setLanguage(newLang);
  };

  const currentLanguage = languages.find((l) => l.code === language);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-white/5 to-white/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg"
    >
      <span className="text-xl">{currentLanguage?.flag}</span>
      <span className="text-xs font-bold text-cyan-400">
        {currentLanguage?.code.toUpperCase()}
      </span>
    </motion.button>
  );
}

export default LanguageSwitcher;
