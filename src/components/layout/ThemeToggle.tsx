"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

type Mode = "system" | "light" | "dark";

const OPTIONS: Array<{ mode: Mode; label: string; icon: IconName }> = [
  { mode: "system", label: "ตามระบบ", icon: "monitor" },
  { mode: "light", label: "สว่าง", icon: "sun" },
  { mode: "dark", label: "มืด", icon: "moon" },
];

/**
 * เมนูเลือกธีมสามสถานะ
 *
 * เดิมเป็นปุ่มกดวนสามสถานะ ซึ่งผู้ใช้ไม่มีทางรู้ว่ากดแล้วจะได้อะไรจนกว่าจะกด
 * ตอนนี้เปิดเป็นเมนูที่เห็นทั้งสามตัวเลือกพร้อมกัน และติ๊กถูกไว้ที่ตัวที่ใช้อยู่
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("delta-theme");
    setMode(saved === "light" || saved === "dark" ? saved : "system");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(next: Mode) {
    setMode(next);
    setOpen(false);
    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("delta-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("delta-theme", next);
    }
    // แจ้ง canvas ให้อ่านสีธีมใหม่ (กราฟวาดเองจึงไม่รู้เรื่อง CSS variable ที่เปลี่ยน)
    window.dispatchEvent(new CustomEvent("delta:themechange"));
  }

  const current = OPTIONS.find((o) => o.mode === mode) ?? OPTIONS[0]!;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`ธีม: ${current.label}`}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
      >
        <Icon name={ready ? current.icon : "monitor"} size={16} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface p-1.5"
        >
          {OPTIONS.map((o) => (
            <button
              key={o.mode}
              type="button"
              role="menuitemradio"
              aria-checked={mode === o.mode}
              onClick={() => apply(o.mode)}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px]",
                mode === o.mode ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2",
              )}
            >
              <Icon name={o.icon} size={15} />
              <span className="flex-1">{o.label}</span>
              {mode === o.mode ? <Icon name="check" size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
