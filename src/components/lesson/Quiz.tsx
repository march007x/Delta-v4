"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";
import { isNumericCorrect, parseNumericAnswer } from "@/lib/answer";
import { ExplainSteps, HintLadder } from "@/components/practice/Assist";

export interface QuizChoiceHtml {
  html: string;
  correct?: boolean;
}

/**
 * คำถามตรวจความเข้าใจระหว่างเรียน — ตรวจในเบราว์เซอร์ ไม่เก็บคะแนน ไม่มีการตัดสิน
 * ข้อความทั้งหมดถูกแปลงเป็น HTML มาจากฝั่งเซิร์ฟเวอร์แล้ว component นี้จึงเบามาก
 */
export function Quiz({
  promptHtml,
  choices,
  explainHtml,
  hintsHtml = [],
}: {
  promptHtml: string;
  choices: QuizChoiceHtml[];
  explainHtml: string;
  hintsHtml?: string[];
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [hintsOpen, setHintsOpen] = useState(0);
  const answered = picked !== null;
  const isCorrect = answered && Boolean(choices[picked]?.correct);

  return (
    <div className="my-5 rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <p
        className="m-0 mb-3 text-[15.5px] font-medium text-ink"
        dangerouslySetInnerHTML={{ __html: promptHtml }}
      />

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {choices.map((c, i) => {
          const chosen = picked === i;
          const reveal = answered && c.correct;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                aria-pressed={chosen}
                className={cx(
                  "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[15px]",
                  !answered && "border-line bg-surface hover:border-accent",
                  reveal && "border-ok bg-ok-soft",
                  answered && chosen && !c.correct && "border-danger bg-danger-soft",
                  answered && !chosen && !c.correct && "border-line bg-surface opacity-60",
                )}
              >
                <span aria-hidden className="mt-0.5 font-mono text-[12px] text-ink-3">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-ink" dangerouslySetInnerHTML={{ __html: c.html }} />
              </button>
            </li>
          );
        })}
      </ul>

      {!answered ? (
        <HintLadder hints={hintsHtml} opened={hintsOpen} onOpen={() => setHintsOpen((n) => n + 1)} />
      ) : null}

      {answered ? (
        <div
          className={cx(
            "mt-3 rounded-lg border-l-[3px] px-4 py-3",
            isCorrect ? "border-l-ok bg-ok-soft" : "border-l-danger bg-danger-soft",
          )}
        >
          <p className="m-0 mb-1 font-display text-[14px] font-semibold text-ink">
            {isCorrect ? "ถูกต้อง" : "ยังไม่ใช่ — ลองอ่านเหตุผลนี้"}
          </p>
          <ExplainSteps html={explainHtml} tone={isCorrect ? "ok" : "danger"} />
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setHintsOpen(0);
            }}
            className="mt-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
          >
            ลองใหม่
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * โจทย์กรอกคำตอบระหว่างอ่านบทเรียน
 *
 * ตรงนี้ยังเฉลยทันทีหลังตอบ ต่างจากโหมดฝึกและโหมดสอบที่กลั้นเฉลยไว้จนจบชุด
 * เพราะระหว่างอ่านคือการเรียน ไม่ใช่การวัดผล — ผู้เรียนควรรู้ผลทันทีเพื่อแก้ความเข้าใจ
 * ส่วนการวัดว่าทำเองได้จริงไหม เป็นหน้าที่ของหน้าฝึกและหน้าข้อสอบ
 */
export function NumericQuestion({
  promptHtml,
  answer,
  tolerance,
  exactHtml,
  unit,
  hintsHtml,
  explainHtml,
}: {
  promptHtml: string;
  answer: number;
  tolerance?: number;
  exactHtml?: string;
  unit?: string;
  hintsHtml: string[];
  explainHtml: string;
}) {
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(0);

  const ready = parseNumericAnswer(typed) !== null;
  const correct = submitted && isNumericCorrect(typed, answer, tolerance);

  return (
    <div className="my-5 rounded-lg border border-line bg-surface-2 p-4 sm:p-5">
      <p className="m-0 mb-1 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
        กรอกคำตอบเอง
      </p>
      <p
        className="m-0 mb-3 text-[15.5px] font-medium text-ink"
        dangerouslySetInnerHTML={{ __html: promptHtml }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={submitted}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ready && !submitted) setSubmitted(true);
          }}
          placeholder="เช่น 12 หรือ -3/4"
          aria-label="คำตอบเป็นตัวเลข"
          className={cx(
            "w-full max-w-[220px] rounded-lg border bg-surface px-3.5 py-2.5 font-mono text-[16px] text-ink outline-none placeholder:text-ink-3",
            submitted
              ? correct
                ? "border-ok"
                : "border-danger"
              : "border-line-strong focus:border-accent",
          )}
        />
        {unit ? <span className="text-[15px] text-ink-2">{unit}</span> : null}
        {!submitted ? (
          <button
            type="button"
            disabled={!ready}
            onClick={() => setSubmitted(true)}
            className="rounded-lg bg-ink px-3.5 py-2 text-[14.5px] font-medium text-bg transition-opacity disabled:opacity-40 hover:opacity-85"
          >
            ตรวจคำตอบ
          </button>
        ) : null}
      </div>

      {!submitted ? (
        <HintLadder hints={hintsHtml} opened={hintsOpen} onOpen={() => setHintsOpen((n) => n + 1)} />
      ) : null}

      {submitted ? (
        <div
          className={cx(
            "mt-3 rounded-lg border-l-[3px] px-4 py-3",
            correct ? "border-l-ok bg-ok-soft" : "border-l-danger bg-danger-soft",
          )}
        >
          <p className="m-0 mb-1.5 font-display text-[14px] font-semibold text-ink">
            {correct ? "ถูกต้อง" : "ยังไม่ใช่"}
            {!correct ? (
              <span className="ml-2 font-mono text-[13px] font-normal text-ink-2">
                คำตอบคือ{" "}
                {exactHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: exactHtml }} />
                ) : (
                  <span>{answer}</span>
                )}
                {unit ? ` ${unit}` : ""}
              </span>
            ) : null}
          </p>
          <ExplainSteps html={explainHtml} tone={correct ? "ok" : "danger"} />
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setTyped("");
              setHintsOpen(0);
            }}
            className="mt-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
          >
            ลองใหม่
          </button>
        </div>
      ) : null}
    </div>
  );
}
