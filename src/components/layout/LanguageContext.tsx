"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "th" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");

  useEffect(() => {
    const saved = localStorage.getItem("delta-language");
    if (saved === "th" || saved === "en") setLanguageState(saved);
  }, []);

  function setLanguage(next: Language) {
    setLanguageState(next);
    localStorage.setItem("delta-language", next);
    document.documentElement.lang = next === "en" ? "en" : "th";
    window.dispatchEvent(new CustomEvent("delta:languagechange"));
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "th" ? "en" : "th"),
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
