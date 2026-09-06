"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "th" | "en";
export type Locale = Language;

type LanguageContextValue = {
  language: Language;
  locale: Locale;
  setLanguage: (language: Language) => void;
  setLocale: (locale: Locale) => void;
  toggleLanguage: () => void;
  toggleLocale: () => void;
};

const STORAGE_KEY = "delta-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("delta-locale");
    if (saved === "th" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next: Language) => setLanguageState(next);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: language,
      setLanguage,
      setLocale: setLanguage,
      toggleLanguage: () => setLanguageState((current) => (current === "th" ? "en" : "th")),
      toggleLocale: () => setLanguageState((current) => (current === "th" ? "en" : "th")),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
