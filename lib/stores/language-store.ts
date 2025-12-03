import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Language, translations } from "../i18n/translations";

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "th",

      setLanguage: (lang: Language) => {
        set({ language: lang });
        // Update document language attribute
        if (typeof document !== "undefined") {
          document.documentElement.lang = lang;
        }
      },

      t: (key: string): string => {
        const lang = get().language;
        const keys = key.split(".");
        let value: unknown = translations[lang];

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = (value as Record<string, unknown>)[k];
          } else {
            // Fallback to English if key not found in current language
            let fallbackValue: unknown = translations["en"];
            for (const fk of keys) {
              if (
                fallbackValue &&
                typeof fallbackValue === "object" &&
                fk in fallbackValue
              ) {
                fallbackValue = (fallbackValue as Record<string, unknown>)[fk];
              } else {
                return key; // Return key if not found in fallback either
              }
            }
            return typeof fallbackValue === "string" ? fallbackValue : key;
          }
        }

        return typeof value === "string" ? value : key;
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language }),
    },
  ),
);

// Selector hooks for better performance
export const useCurrentLanguage = () => useLanguage((state) => state.language);
export const useTranslation = () => useLanguage((state) => state.t);
