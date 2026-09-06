import { cx } from "@/lib/utils";

/**
 * กล่องเน้นในบทเรียน
 *
 * พื้นเป็นสีกลางเหมือนกันทุกชนิด ต่างกันแค่ **เส้นซ้าย** กับป้ายกำกับ
 * เพราะบทเรียนหนึ่งบทมีกล่องพวกนี้สิบกว่าอัน ถ้าแต่ละอันมีพื้นสีของตัวเอง
 * หน้าจะกลายเป็นแถบสีสลับกันจนอ่านไม่รู้ว่าอะไรสำคัญกว่าอะไร
 * สีจึงถูกเก็บไว้ที่เส้นบาง ๆ เส้นเดียว ซึ่งพอบอกชนิดได้โดยไม่แย่งสายตาจากตัวเนื้อหา
 */
const TONES = {
  note: { rule: "border-l-accent", label: "หมายเหตุ", ink: "text-accent" },
  tip: { rule: "border-l-ok", label: "เคล็ดลับ", ink: "text-ok" },
  warn: { rule: "border-l-warn", label: "ข้อควรระวัง", ink: "text-warn" },
  mistake: { rule: "border-l-danger", label: "จุดที่มักผิด", ink: "text-danger" },
  rule: { rule: "border-l-delta", label: "กฎ", ink: "text-delta" },
} as const;

export type CalloutTone = keyof typeof TONES;

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div
      className={cx(
        "my-5 border-l-2 bg-surface-2 px-5 py-4 text-ink sm:px-6 sm:py-5",
        t.rule,
      )}
    >
      <p className={cx("m-0 mb-2 font-mono text-[10.5px] tracking-[0.13em] uppercase", t.ink)}>
        {t.label}
      </p>
      {title ? (
        <p className="m-0 mb-1.5 font-display text-[16px] font-medium text-ink">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
