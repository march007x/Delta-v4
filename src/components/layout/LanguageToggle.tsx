"use client";

import { useLanguage } from "./LanguageContext";
import { cx } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="flex h-9 items-center rounded-lg border border-line bg-surface p-0.5"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLanguage("th")}
        aria-pressed={language === "th"}
        className={cx(
          "h-8 rounded-md px-2.5 font-mono text-[11px] font-medium transition-colors",
          language === "th" ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink",
        )}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={cx(
          "h-8 rounded-md px-2.5 font-mono text-[11px] font-medium transition-colors",
          language === "en" ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink",
        )}
      >
        EN
      </button>
    </div>
  );
}
