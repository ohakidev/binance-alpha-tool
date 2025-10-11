import { create } from "zustand";
import { persist } from "zustand/middleware";
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

      setLanguage: (lang: Language) => set({ language: lang }),

      t: (key: string): string => {
        const lang = get().language;
        const keys = key.split(".");
        let value: unknown = translations[lang];

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = (value as Record<string, unknown>)[k];
          } else {
            return key; // Return key if translation not found
          }
        }

        return typeof value === "string" ? value : key;
      },
    }),
    {
      name: "language-storage",
    }
  )
);
