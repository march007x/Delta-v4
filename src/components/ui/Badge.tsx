import { cx } from "@/lib/utils";

/** ป้ายไม่มีพื้นสี — เหลือแค่กรอบผมกับสีตัวอักษร ป้ายมีพื้นเยอะ ๆ ทำให้หน้าดูเป็นแดชบอร์ด */
const TONES = {
  accent: "text-accent border-accent/45",
  neutral: "text-ink-3 border-line-strong",
  ok: "text-ok border-ok/45",
  warn: "text-warn border-warn/45",
  delta: "text-delta border-delta/45",
} as const;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cx(
        "inline-block rounded-[2px] border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em]",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
