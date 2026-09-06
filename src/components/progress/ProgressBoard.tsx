"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import { useProgress } from "@/lib/progress/store";
import { needsReview, usePracticeResults } from "@/lib/progress/practice";
import { useExamResults } from "@/lib/progress/exam";
import type { ProgressLesson } from "@/lib/repo/progress-index";

type Next =
  | { kind: "review"; lesson: ProgressLesson; score: string }
  | { kind: "practice"; lesson: ProgressLesson }
  | { kind: "learn"; lesson: ProgressLesson }
  | { kind: "exam" }
  | { kind: "done" };

/**
 * หน้าความก้าวหน้า — รวมข้อมูลสามชุดใน localStorage แล้วตอบคำถามเดียวว่า
 * **ตอนนี้ควรทำอะไรต่อ**
 *
 * ผู้เรียนคนเดียวไม่มีครูคอยบอกลำดับ หน้านี้จึงทำหน้าที่นั้นแทน
 * และลำดับที่แนะนำมาจากกราฟพื้นฐาน (prerequisites) ที่ออกแบบไว้ตั้งแต่ Phase 0 จริง ๆ
 */
export function ProgressBoard({ lessons }: { lessons: ProgressLesson[] }) {
  const { map: lessonMap, ready: lessonReady } = useProgress();
  const { map: practiceMap, ready: practiceReady } = usePracticeResults();
  const { map: examMap, ready: examReady } = useExamResults();
  const ready = lessonReady && practiceReady && examReady;

  const completedTopics = useMemo(() => {
    const s = new Set<string>();
    for (const l of lessons) {
      if (lessonMap[l.id]?.status === "completed") s.add(l.topicId);
    }
    return s;
  }, [lessons, lessonMap]);

  const stats = useMemo(() => {
    const done = lessons.filter((l) => lessonMap[l.id]?.status === "completed");
    const started = lessons.filter((l) => lessonMap[l.id]?.status === "in_progress");
    const practiced = lessons.filter((l) => practiceMap[l.slug]);
    const weak = practiced.filter((l) => {
      const r = practiceMap[l.slug];
      return r && needsReview(r);
    });
    const examCount = Object.keys(examMap).length;
    return { done, started, practiced, weak, examCount, total: lessons.length };
  }, [lessons, lessonMap, practiceMap, examMap]);

  const next: Next = useMemo(() => {
    // 1. บทที่ทำแบบฝึกได้ต่ำกว่าเกณฑ์ ต้องกลับไปทบทวนก่อนเดินหน้าต่อ
    const weakest = stats.weak
      .map((l) => ({ l, r: practiceMap[l.slug]! }))
      .sort((a, b) => a.r.correct / a.r.total - b.r.correct / b.r.total)[0];
    if (weakest) {
      return {
        kind: "review",
        lesson: weakest.l,
        score: `${weakest.r.correct}/${weakest.r.total}`,
      };
    }

    // 2. บทที่อ่านจบแล้วแต่ยังไม่เคยทำแบบฝึก
    const unpracticed = lessons.find(
      (l) => lessonMap[l.id]?.status === "completed" && !practiceMap[l.slug] && l.quizCount > 0,
    );
    if (unpracticed) return { kind: "practice", lesson: unpracticed };

    // 3. บทถัดไปที่พื้นฐานครบแล้ว
    const nextLesson = lessons.find(
      (l) =>
        lessonMap[l.id]?.status !== "completed" &&
        l.prerequisites.every((p) => completedTopics.has(p)),
    );
    if (nextLesson) return { kind: "learn", lesson: nextLesson };

    // 4. เรียนครบแล้วแต่ยังไม่เคยลองข้อสอบจำลอง
    if (stats.examCount === 0) return { kind: "exam" };
    return { kind: "done" };
  }, [lessons, lessonMap, practiceMap, completedTopics, stats]);

  const byCourse = useMemo(() => {
    const m = new Map<string, ProgressLesson[]>();
    for (const l of lessons) {
      const list = m.get(l.course) ?? [];
      list.push(l);
      m.set(l.course, list);
    }
    return [...m.entries()];
  }, [lessons]);

  if (!ready) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-[15px] text-ink-3">
        กำลังอ่านความก้าวหน้าจากเบราว์เซอร์…
      </p>
    );
  }

  const untouched = stats.done.length === 0 && stats.started.length === 0 && stats.practiced.length === 0;

  return (
    <div className="flex flex-col gap-9">
      <section
        className={cx(
          "rounded-lg border p-5 sm:p-6",
          next.kind === "review" ? "border-danger bg-danger-soft" : "border-accent bg-accent-soft",
        )}
      >
        <p className="m-0 mb-1 font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
          ทำอะไรต่อดี
        </p>

        {next.kind === "review" ? (
          <>
            <p className="m-0 mb-1 font-display text-[20px] font-semibold text-ink">
              ทบทวน “{next.lesson.title}” ก่อน
            </p>
            <p className="m-0 mb-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              แบบฝึกบทนี้ได้ {next.score} ซึ่งต่ำกว่าเกณฑ์ 70% ·
              การเดินหน้าต่อทั้งที่บทพื้นฐานยังไม่แน่นจะทำให้บทถัดไปยากขึ้นโดยไม่จำเป็น
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/lesson/${next.lesson.slug}`}
                className="rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg no-underline hover:opacity-90"
              >
                อ่านบทนี้อีกรอบ
              </Link>
              <Link
                href={`/practice/${next.lesson.slug}`}
                className="rounded-lg border border-line-strong bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:text-ink"
              >
                ทำแบบฝึกใหม่
              </Link>
            </div>
          </>
        ) : next.kind === "practice" ? (
          <>
            <p className="m-0 mb-1 font-display text-[20px] font-semibold text-ink">
              ลองทำแบบฝึกของ “{next.lesson.title}”
            </p>
            <p className="m-0 mb-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              อ่านบทนี้จบแล้วแต่ยังไม่เคยวัดผล · อ่านเข้าใจกับทำโจทย์ได้เป็นคนละเรื่อง
              และรู้ได้ทางเดียวคือลองทำ
            </p>
            <Link
              href={`/practice/${next.lesson.slug}`}
              className="inline-block rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg no-underline hover:opacity-90"
            >
              เริ่มทำ {next.lesson.quizCount} ข้อ
            </Link>
          </>
        ) : next.kind === "learn" ? (
          <>
            <p className="m-0 mb-1 font-display text-[20px] font-semibold text-ink">
              {untouched ? "เริ่มที่ " : "บทถัดไป: "}“{next.lesson.title}”
            </p>
            <p className="m-0 mb-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              {next.lesson.course} · {next.lesson.chapter} · ประมาณ {next.lesson.minutes} นาที
              {next.lesson.prerequisites.length > 0
                ? " · พื้นฐานที่ต้องใช้ผ่านครบแล้ว"
                : " · ไม่ต้องใช้พื้นฐานอะไรก่อน"}
            </p>
            <Link
              href={`/lesson/${next.lesson.slug}`}
              className="inline-block rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg no-underline hover:opacity-90"
            >
              เปิดบทเรียน
            </Link>
          </>
        ) : next.kind === "exam" ? (
          <>
            <p className="m-0 mb-1 font-display text-[20px] font-semibold text-ink">
              ลองข้อสอบจำลองแบบจับเวลา
            </p>
            <p className="m-0 mb-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              อ่านครบทุกบทแล้ว · ขั้นต่อไปคือฝึกจังหวะการทำข้อสอบจริง
              ซึ่งเป็นทักษะคนละอย่างกับการทำโจทย์ทีละข้อแบบมีเฉลย
            </p>
            <Link
              href="/exam"
              className="inline-block rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg no-underline hover:opacity-90"
            >
              เลือกชุดข้อสอบ
            </Link>
          </>
        ) : (
          <>
            <p className="m-0 mb-1 font-display text-[20px] font-semibold text-ink">
              ครบทุกอย่างที่มีตอนนี้แล้ว
            </p>
            <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              อ่านครบ ทำแบบฝึกผ่านเกณฑ์ทุกบท และลองข้อสอบจำลองแล้ว ·
              ทำชุดข้อสอบที่เหลือเพื่อรักษาความแม่น หรือกลับไปทบทวนบทที่ทิ้งช่วงนานที่สุด
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">ภาพรวม</h2>
        <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["อ่านจบแล้ว", `${stats.done.length}/${stats.total} บท`],
              ["กำลังอ่าน", `${stats.started.length} บท`],
              ["ทำแบบฝึกแล้ว", `${stats.practiced.length} บท`],
              ["ข้อสอบจำลอง", `${stats.examCount} ชุด`],
            ] as Array<[string, string]>
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-surface px-4 py-3">
              <dt className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
                {label}
              </dt>
              <dd className="m-0 mt-0.5 font-display text-[19px] font-semibold text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">
          รายบท
          <span className="ml-2 font-mono text-[12px] font-normal text-ink-3">
            ● อ่านจบ · ◐ กำลังอ่าน · ○ ยังไม่เริ่ม
          </span>
        </h2>

        <div className="flex flex-col gap-6">
          {byCourse.map(([course, list]) => (
            <div key={course}>
              <p className="m-0 mb-2 border-b border-line pb-1.5 font-display text-[15px] font-semibold text-ink-2">
                {course}
              </p>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {list.map((l) => {
                  const status = lessonMap[l.id]?.status ?? "not_started";
                  const r = practiceMap[l.slug];
                  const locked = !l.prerequisites.every((p) => completedTopics.has(p));
                  return (
                    <li
                      key={l.id}
                      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-2"
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "font-mono text-[13px]",
                          status === "completed"
                            ? "text-ok"
                            : status === "in_progress"
                              ? "text-accent-ink"
                              : "text-ink-3",
                        )}
                      >
                        {status === "completed" ? "●" : status === "in_progress" ? "◐" : "○"}
                      </span>
                      <Link
                        href={`/lesson/${l.slug}`}
                        className="min-w-0 flex-1 text-[15px] text-ink no-underline hover:text-accent-ink"
                      >
                        {l.title}
                        {locked && status === "not_started" ? (
                          <span className="ml-2 font-mono text-[11.5px] text-ink-3">
                            (ควรเรียนพื้นฐานก่อน)
                          </span>
                        ) : null}
                      </Link>
                      {r ? (
                        <Link
                          href={`/practice/${l.slug}`}
                          className={cx(
                            "shrink-0 rounded-md border px-2 py-0.5 font-mono text-[12px] no-underline",
                            needsReview(r)
                              ? "border-danger bg-danger-soft text-ink"
                              : "border-ok bg-ok-soft text-ink",
                          )}
                        >
                          {r.correct}/{r.total}
                        </Link>
                      ) : l.quizCount > 0 ? (
                        <Link
                          href={`/practice/${l.slug}`}
                          className="shrink-0 font-mono text-[12px] text-ink-3 no-underline hover:text-ink"
                        >
                          ฝึก {l.quizCount} ข้อ
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
