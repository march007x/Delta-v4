"use client";

import { cx } from "@/lib/utils";

/**
 * ตัวช่วยระหว่างทำโจทย์ — รวมไว้ไฟล์เดียวเพราะสองส่วนนี้ทำงานคู่กันเสมอ
 * (ขอแนวทางก่อนตอบ · อ่านเฉลยเป็นขั้นหลังตอบ)
 */

/**
 * แนวทางแบบไล่ระดับ — เปิดทีละขั้นตามที่ผู้เรียนกดขอ
 *
 * เหตุผลที่ไม่เปิดรวดเดียว: แนวทางที่ดีคือสิ่งที่ทำให้ผู้เรียนคิดต่อได้เอง
 * ถ้าเทให้หมดในครั้งเดียวมันจะกลายเป็นวิธีทำ แล้วผู้เรียนก็แค่ลอกตาม
 * การกดทีละขั้นยังเป็นสัญญาณด้วยว่าข้อไหนยากจริงสำหรับคนนี้
 */
export function HintLadder({
  hints,
  opened,
  onOpen,
  disabled,
}: {
  hints: string[];
  opened: number;
  onOpen: () => void;
  disabled?: boolean;
}) {
  if (hints.length === 0) return null;
  const remaining = hints.length - opened;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {hints.slice(0, opened).map((h, i) => (
        <div
          key={i}
          className="rounded-lg border-l-[3px] border-l-warn bg-warn-soft px-3.5 py-2 text-[14px] leading-relaxed text-ink"
        >
          <span className="mr-1.5 font-mono text-[11px] text-ink-3">แนวทาง {i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: h }} />
        </div>
      ))}

      {remaining > 0 && !disabled ? (
        <button
          type="button"
          onClick={onOpen}
          className={cx(
            "self-start rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2",
            "hover:border-line-strong hover:text-ink",
          )}
        >
          {opened === 0 ? "ขอแนวทาง" : `ขอแนวทางเพิ่ม (เหลืออีก ${remaining} ขั้น)`}
        </button>
      ) : null}

      {remaining === 0 && opened > 0 ? (
        <p className="m-0 font-mono text-[11.5px] text-ink-3">
          หมดแนวทางแล้ว — ที่เหลือต้องลองคิดเอง
        </p>
      ) : null}
    </div>
  );
}

/**
 * แสดงคำเฉลยเป็นขั้น ๆ แทนย่อหน้าเดียวยาว
 *
 * เนื้อหาเขียนคำเฉลยโดยคั่นแต่ละขั้นด้วย " · " อยู่แล้ว แต่เดิมเรนเดอร์รวดเดียว
 * ทำให้คนที่เพิ่งทำผิด — ซึ่งเป็นคนที่ต้องการเห็นทีละบรรทัดมากที่สุด —
 * ได้รูปแบบที่อ่านยากที่สุด ตัวคั่นเดิมจึงถูกใช้แยกบรรทัดตรงนี้แทน
 *
 * ตัดตรงตัวคั่นที่อยู่นอกสูตรเท่านั้น เพราะ " · " โผล่ในสูตรได้ (เช่น a · b)
 */
export function splitExplain(html: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < html.length; i++) {
    const c = html[i]!;
    if (c === "<") depth++;
    if (c === ">") depth--;
    // ตัวคั่นที่นับ ต้องอยู่นอกแท็ก และมีช่องว่างขนาบทั้งสองข้าง
    if (depth === 0 && c === "·" && html[i - 1] === " " && html[i + 1] === " ") {
      parts.push(buf.trim());
      buf = "";
      i++;
      continue;
    }
    buf += c;
  }
  parts.push(buf.trim());
  return parts.filter((p) => p.length > 0);
}

export function ExplainSteps({ html, tone }: { html: string; tone: "ok" | "danger" | "plain" }) {
  const steps = splitExplain(html);

  if (steps.length < 2) {
    return (
      <p
        className="m-0 text-[14.5px] leading-relaxed text-ink-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
      {steps.map((s, i) => (
        <li key={i} className="grid grid-cols-[18px_1fr] gap-2">
          <span
            aria-hidden
            className={cx(
              "pt-0.5 text-right font-mono text-[11px] tabular-nums",
              tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : "text-ink-3",
            )}
          >
            {i + 1}
          </span>
          <span
            className="text-[14.5px] leading-relaxed text-ink-2"
            dangerouslySetInnerHTML={{ __html: s }}
          />
        </li>
      ))}
    </ol>
  );
}
