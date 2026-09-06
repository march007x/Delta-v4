"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import { shuffle } from "@/lib/quiz";
import { isNumericCorrect, parseNumericAnswer } from "@/lib/answer";
import { usePracticeResults } from "@/lib/progress/practice";
import type { PracticeQuestion } from "@/lib/repo/practice";
import { ExplainSteps, HintLadder } from "./Assist";

type Phase = "idle" | "running" | "done";

interface Answered {
  id: string;
  correct: boolean;
  /** สิ่งที่ผู้เรียนตอบ — เก็บไว้แสดงตอนสรุปว่าตอบอะไรไป */
  given: string;
  /** ดัชนีตัวเลือกที่กด (ปรนัยเท่านั้น) — ตัวอักษร A/B/C/D อย่างเดียวไม่พอ
      เพราะตัวเลือกถูกสับใหม่ทุกรอบ ผู้เรียนจึงย้อนไม่ได้ว่า "B" ของข้อนั้นเขียนว่าอะไร */
  pickedIndex?: number;
  hintsUsed: number;
}

/** สับทั้งลำดับข้อและลำดับตัวเลือก — ทำซ้ำแล้วต้องคิดใหม่ ไม่ใช่จำว่าเคยกดข้อไหน */
function makeRound(questions: PracticeQuestion[]): PracticeQuestion[] {
  return shuffle(questions).map((q) =>
    q.kind === "choice" ? { ...q, choices: shuffle(q.choices) } : q,
  );
}

/**
 * โหมดฝึก — ทำจนจบชุดก่อน แล้วจึงเฉลยทุกข้อพร้อมกัน
 *
 * เดิมเฉลยทันทีทุกข้อ ซึ่งทำให้ผู้เรียนอ่านเฉลยแล้วรู้สึกว่า "เข้าใจแล้ว"
 * ทั้งที่ยังทำเองไม่ได้ · การกลั้นเฉลยไว้จนจบบังคับให้ต้องตัดสินใจด้วยตัวเอง
 * ทุกข้อ และทำให้คะแนนที่ได้สะท้อนความสามารถจริง ไม่ใช่ความสามารถหลังดูเฉลย
 *
 * สิ่งที่ให้แทนระหว่างทางคือ **แนวทางไล่ระดับ** ซึ่งช่วยคิดได้โดยไม่บอกคำตอบ
 */
export function PracticeRunner({
  slug,
  title,
  questions,
}: {
  slug: string;
  title: string;
  questions: PracticeQuestion[];
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<PracticeQuestion[]>(questions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [hintsOpen, setHintsOpen] = useState(0);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const { save, map, ready } = usePracticeResults();

  const previous = ready ? map[slug] : undefined;
  const current = order[index];
  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);
  const hintTotal = useMemo(() => answers.reduce((n, a) => n + a.hintsUsed, 0), [answers]);

  const answerReady =
    current?.kind === "choice" ? picked !== null : parseNumericAnswer(typed) !== null;

  function start() {
    setOrder(makeRound(questions));
    setIndex(0);
    setPicked(null);
    setTyped("");
    setHintsOpen(0);
    setAnswers([]);
    setPhase("running");
  }

  /** บันทึกคำตอบข้อปัจจุบันแล้วไปข้อถัดไป — ไม่มีการเฉลยตรงนี้โดยตั้งใจ */
  function submitAndAdvance() {
    if (!current || !answerReady) return;

    const record: Answered =
      current.kind === "choice"
        ? {
            id: current.id,
            correct: Boolean(current.choices[picked!]?.correct),
            given: String.fromCharCode(65 + picked!),
            pickedIndex: picked!,
            hintsUsed: hintsOpen,
          }
        : {
            id: current.id,
            correct: isNumericCorrect(typed, current.answer, current.tolerance),
            given: typed.trim(),
            hintsUsed: hintsOpen,
          };

    const all = [...answers, record];
    setAnswers(all);
    setPicked(null);
    setTyped("");
    setHintsOpen(0);

    if (index + 1 >= order.length) {
      save(slug, {
        correct: all.filter((a) => a.correct).length,
        total: order.length,
        missed: all.filter((a) => !a.correct).map((a) => a.id),
      });
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (phase === "idle") {
    const numericCount = questions.filter((q) => q.kind === "numeric").length;
    return (
      <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <p className="m-0 mb-1 font-display text-[18px] font-semibold text-ink">
          ชุดฝึก {questions.length} ข้อ
          {numericCount > 0 ? ` · กรอกคำตอบเอง ${numericCount} ข้อ` : ""}
        </p>
        <ul className="m-0 mb-4 max-w-[58ch] list-disc pl-5 text-[15px] leading-[1.9] text-ink-2">
          <li>
            <strong className="font-semibold text-ink">ไม่เฉลยระหว่างทำ</strong> —
            เฉลยทุกข้อขึ้นพร้อมกันเมื่อทำจบชุด เพื่อให้คะแนนสะท้อนว่าทำเองได้จริงแค่ไหน
          </li>
          <li>ติดตรงไหนกด “ขอแนวทาง” ได้ ระบบจะใบ้ทีละขั้น ไม่บอกคำตอบ</li>
          <li>โจทย์และตัวเลือกสับใหม่ทุกครั้งที่เริ่ม</li>
          {numericCount > 0 ? <li>ข้อกรอกคำตอบพิมพ์เศษส่วนได้ เช่น 8/3 หรือ 2.67</li> : null}
        </ul>

        {previous ? (
          <p className="m-0 mb-4 rounded-lg border border-line bg-surface-2 px-4 py-2.5 font-mono text-[13px] text-ink-2">
            รอบที่แล้ว {previous.correct}/{previous.total} ข้อ
            {previous.correct / previous.total < 0.7 ? " — ควรทบทวนบทนี้ก่อน" : ""}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg transition-opacity hover:opacity-85"
          >
            เริ่มทำ
          </button>
          <Link
            href={`/lesson/${slug}`}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            อ่านบท {title} ก่อน
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const byId = new Map(answers.map((a) => [a.id, a]));
    const pct = Math.round((score / order.length) * 100);

    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <p className="m-0 font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
            ผลรอบนี้
          </p>
          <p className="m-0 my-1 font-display text-[32px] font-bold tracking-tight text-ink">
            {score} / {order.length}
            <span className="ml-2 font-mono text-[16px] font-normal text-ink-3">({pct}%)</span>
          </p>
          {hintTotal > 0 ? (
            <p className="m-0 mb-1 font-mono text-[12.5px] text-ink-3">
              ใช้แนวทางไปทั้งหมด {hintTotal} ขั้น — ข้อที่ต้องใช้แนวทางคือข้อที่ควรกลับไปทบทวน
            </p>
          ) : null}
          <p className="m-0 text-[15px] leading-relaxed text-ink-2">
            {pct >= 90
              ? "แม่นแล้ว — ข้ามไปบทถัดไปได้เลย"
              : pct >= 70
                ? "ใช้ได้ แต่ยังมีจุดที่พลาด ลองอ่านเฉลยข้างล่างให้ครบก่อนไปต่อ"
                : "ยังไม่แน่น — แนะนำให้กลับไปอ่านบทเรียนอีกรอบ แล้วค่อยมาทำใหม่"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg transition-opacity hover:opacity-85"
            >
              ทำใหม่อีกรอบ
            </button>
            <Link
              href={`/lesson/${slug}`}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
            >
              กลับไปอ่านบทเรียน
            </Link>
            <Link
              href="/practice"
              className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
            >
              เลือกชุดอื่น
            </Link>
          </div>
        </div>

        <div>
          <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">
            เฉลยทุกข้อ ({order.length} ข้อ)
          </h2>
          <div className="flex flex-col gap-3">
            {order.map((q, i) => {
              const a = byId.get(q.id);
              const ok = a?.correct ?? false;
              return (
                <div
                  key={q.id}
                  className={cx(
                    "rounded-lg border bg-surface p-4",
                    ok ? "border-line" : "border-danger",
                  )}
                >
                  <p className="m-0 mb-1.5 flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-ink-3">
                    <span>ข้อ {i + 1}</span>
                    <span
                      className={cx(
                        "rounded px-1.5 py-0.5",
                        ok ? "bg-ok-soft text-ink" : "bg-danger-soft text-ink",
                      )}
                    >
                      {ok ? "ถูก" : "ผิด"}
                    </span>
                    {q.kind === "numeric" ? <span>คุณตอบ {a?.given || "—"}</span> : null}
                    {a && a.hintsUsed > 0 ? <span>· ใช้แนวทาง {a.hintsUsed} ขั้น</span> : null}
                  </p>

                  <p
                    className="m-0 mb-2 text-[15.5px] font-medium text-ink"
                    dangerouslySetInnerHTML={{ __html: q.promptHtml }}
                  />

                  <p className="m-0 mb-1 font-mono text-[12px] text-ink-3">
                    {q.kind === "choice" ? "ตัวเลือกทั้งหมด" : "คำตอบที่ถูก"}
                  </p>
                  {q.kind === "choice" ? (
                    <ul className="m-0 mb-2.5 flex list-none flex-col gap-1.5 p-0">
                      {q.choices.map((c, ci) => {
                        const chose = a?.pickedIndex === ci;
                        return (
                          <li
                            key={ci}
                            className={cx(
                              "flex items-start gap-2 rounded-lg border px-3 py-1.5 text-[15px] text-ink",
                              c.correct
                                ? "border-ok bg-ok-soft"
                                : chose
                                  ? "border-danger bg-danger-soft"
                                  : "border-line bg-bg",
                            )}
                          >
                            <span aria-hidden className="mt-0.5 font-mono text-[11.5px] text-ink-3">
                              {String.fromCharCode(65 + ci)}
                            </span>
                            <span
                              className="min-w-0 flex-1"
                              dangerouslySetInnerHTML={{ __html: c.html }}
                            />
                            {c.correct ? (
                              <span className="shrink-0 font-mono text-[11px] text-ok">
                                คำตอบที่ถูก
                              </span>
                            ) : chose ? (
                              <span className="shrink-0 font-mono text-[11px] text-danger">
                                คุณตอบข้อนี้
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="m-0 mb-2.5 rounded-lg border border-ok bg-ok-soft px-3 py-1.5 text-[15px] text-ink">
                      {q.exactHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: q.exactHtml }} />
                      ) : (
                        q.answer
                      )}
                      {q.exactHtml ? (
                        <span className="ml-2 font-mono text-[13px] text-ink-3">
                          ≈ {Math.round(q.answer * 10000) / 10000}
                        </span>
                      ) : null}
                      {q.unit ? <span className="ml-1">{q.unit}</span> : null}
                    </p>
                  )}

                  <ExplainSteps html={q.explainHtml} tone={ok ? "ok" : "danger"} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[12px] text-ink-3">
          <span>
            ข้อ {index + 1} จาก {order.length} · {current.origin}
          </span>
          <span>เฉลยขึ้นเมื่อทำครบ</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={order.length}
          aria-label="ความคืบหน้าของชุดฝึก"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${(index / order.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <p
          className="m-0 mb-3 text-[16px] font-medium text-ink"
          dangerouslySetInnerHTML={{ __html: current.promptHtml }}
        />

        {current.kind === "choice" ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {current.choices.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setPicked(i)}
                  aria-pressed={picked === i}
                  className={cx(
                    "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[15px]",
                    picked === i
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-surface-2 hover:border-accent",
                  )}
                >
                  <span aria-hidden className="mt-0.5 font-mono text-[12px] text-ink-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-ink" dangerouslySetInnerHTML={{ __html: c.html }} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <label
              htmlFor="numeric-answer"
              className="mb-1.5 block font-mono text-[12px] text-ink-3"
            >
              กรอกคำตอบเป็นตัวเลข (เศษส่วนก็ได้ เช่น 8/3)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="numeric-answer"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && answerReady) submitAndAdvance();
                }}
                placeholder="เช่น 12 หรือ -3/4 หรือ 2.5"
                className="w-full max-w-[240px] rounded-lg border border-line-strong bg-surface-2 px-3.5 py-2.5 font-mono text-[16px] text-ink outline-none placeholder:text-ink-3 focus:border-accent"
              />
              {current.unit ? (
                <span className="shrink-0 text-[15px] text-ink-2">{current.unit}</span>
              ) : null}
            </div>
            {typed.trim() !== "" && !answerReady ? (
              <p className="m-0 mt-1.5 text-[13px] text-danger">
                ยังอ่านเป็นตัวเลขไม่ได้ — พิมพ์ได้เฉพาะตัวเลข จุดทศนิยม เครื่องหมายลบ และเศษส่วน
              </p>
            ) : null}
          </div>
        )}

        <HintLadder
          hints={current.hintsHtml}
          opened={hintsOpen}
          onOpen={() => setHintsOpen((n) => n + 1)}
        />

        <button
          type="button"
          disabled={!answerReady}
          onClick={submitAndAdvance}
          className="mt-4 rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg disabled:opacity-40 hover:opacity-90"
        >
          {index + 1 >= order.length ? "ส่งคำตอบและดูเฉลย" : "ข้อถัดไป"}
        </button>
        {!answerReady ? (
          <p className="m-0 mt-1.5 font-mono text-[11.5px] text-ink-3">
            {current.kind === "choice" ? "เลือกคำตอบก่อน" : "กรอกคำตอบก่อน"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
