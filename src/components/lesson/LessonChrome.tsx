"use client";

import { useState } from "react";
import { useLanguage } from "@/components/layout/LanguageContext";

export interface LessonOutlineItem {
  id: string;
  title: string;
}

export function LessonChrome({
  sections,
  children,
}: {
  sections: LessonOutlineItem[];
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  const [open, setOpen] = useState(true);

  return (
    <div className={open ? "grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)]" : "block"}>
      {open ? (
        <nav className="hidden lg:block" aria-label={en ? "Lesson outline" : "หัวข้อในบทเรียน"}>
          <div className="sticky top-20">
            <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
              <p className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                {en ? "Lesson outline" : "ลำดับการสอน"}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={en ? "Hide lesson outline" : "ซ่อนสารบัญบทเรียน"}
                className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-3 hover:border-line-strong hover:text-ink"
              >
                <span className="text-[16px] leading-none" aria-hidden>‹</span>
              </button>
            </div>
            <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="grid grid-cols-[22px_1fr] gap-1 rounded-md px-2 py-1 text-[13px] leading-snug text-ink-2 no-underline hover:bg-surface-2 hover:text-ink"
                  >
                    <span className="pt-px font-mono text-[10.5px] text-ink-3">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      ) : null}

      <div className="min-w-0">
        {!open ? (
          <div className="mb-5 flex justify-start">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={en ? "Show lesson outline" : "แสดงสารบัญบทเรียน"}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[11.5px] text-ink-2 hover:border-line-strong hover:text-ink"
            >
              <span className="text-[16px] leading-none" aria-hidden>›</span>
              {en ? "Outline" : "สารบัญ"}
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
