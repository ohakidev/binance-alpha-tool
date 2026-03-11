"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/stores/language-store";

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = useLanguage((state) => state.language);

  useEffect(() => {
    if (!useLanguage.persist.hasHydrated()) {
      void useLanguage.persist.rehydrate();
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <>{children}</>;
}
