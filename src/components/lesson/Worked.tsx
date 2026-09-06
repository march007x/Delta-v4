"use client";

import { useState } from "react";

export interface WorkedStepHtml {
  textHtml: string;
  latexHtml?: string;
}

/**
 * ตัวอย่างพร้อมวิธีคิด — เปิดทีละขั้น เพื่อให้ผู้เรียนได้ลองคิดก่อนเห็นบรรทัดถัดไป
 * การเห็นวิธีทำทั้งหมดพร้อมกันทำให้สมองข้ามขั้นตอนการคิดไป
 */
export function Worked({
  promptHtml,
  steps,
  answerHtml,
}: {
  promptHtml: string;
  steps: WorkedStepHtml[];
  answerHtml: string;
}) {
  const [shown, setShown] = useState(0);
  const done = shown >= steps.length;

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line bg-surface-2 px-4 py-3">
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">โจทย์</p>
        <p
          className="m-0 text-[15.5px] font-medium text-ink"
          dangerouslySetInnerHTML={{ __html: promptHtml }}
        />
      </div>

      <ol className="m-0 list-none p-0">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className="border-b border-line px-4 py-3">
            <div className="flex gap-3">
              <span className="mt-0.5 font-mono text-[11.5px] text-accent-ink">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p
                  className="m-0 text-[15px] leading-relaxed text-ink-2"
                  dangerouslySetInnerHTML={{ __html: s.textHtml }}
                />
                {s.latexHtml ? (
                  <div
                    className="my-2 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: s.latexHtml }}
                  />
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="px-4 py-3">
        {!done ? (
          <button
            type="button"
            onClick={() => setShown((n) => n + 1)}
            className="rounded-lg border border-accent bg-accent-soft px-3.5 py-2 font-mono text-[12px] text-accent-ink hover:opacity-90"
          >
            {shown === 0 ? "เริ่มดูวิธีทำ" : `ดูขั้นที่ ${shown + 1}`} · เหลืออีก{" "}
            {steps.length - shown} ขั้น
          </button>
        ) : (
          <div className="rounded-lg border-l-[3px] border-l-ok bg-ok-soft px-4 py-3">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.13em] text-ok">คำตอบ</p>
            <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: answerHtml }} />
          </div>
        )}
      </div>
    </div>
  );
}
