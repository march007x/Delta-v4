"use client";

import Link from "next/link";
import { needsReview, usePracticeResults } from "@/lib/progress/practice";
import type { PracticeSummary } from "@/lib/repo/practice";

/**
 * หน้ารวมชุดฝึก — จุดสำคัญคือ **ชี้ให้เห็นบทที่ควรทบทวนก่อน** ไม่ใช่แค่แสดงรายการ
 * ผู้เรียนคนเดียวไม่มีครูคอยบอกว่าอ่อนตรงไหน ตัวเลขในหน้านี้จึงทำหน้าที่นั้นแทน
 */
export function PracticeIndex({ sets }: { sets: PracticeSummary[] }) {
  const { map, ready, reset } = usePracticeResults();

  const done = sets.filter((s) => map[s.slug]);
  const weak = done.filter((s) => {
    const r = map[s.slug];
    return r && needsReview(r);
  });
  const totalAnswered = done.reduce((n, s) => n + (map[s.slug]?.total ?? 0), 0);
  const totalCorrect = done.reduce((n, s) => n + (map[s.slug]?.correct ?? 0), 0);

  const byCourse = new Map<string, PracticeSummary[]>();
  for (const s of sets) {
    const list = byCourse.get(s.course) ?? [];
    list.push(s);
    byCourse.set(s.course, list);
  }

  return (
    <div>
      {ready && done.length > 0 ? (
        <div className="mb-9 rounded-lg border border-line bg-surface p-5">
          <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
            สรุปของคุณ
          </p>
          <p className="m-0 mb-1 font-display text-[17px] font-semibold text-ink">
            ทำแล้ว {done.length} ชุด · ถูก {totalCorrect} จาก {totalAnswered} ข้อ
          </p>
          {weak.length > 0 ? (
            <>
              <p className="m-0 mt-2 text-[15px] leading-relaxed text-ink-2">
                บทที่ทำได้ต่ำกว่า 70% และควรกลับไปอ่านก่อนทำใหม่:
              </p>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                {weak.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/lesson/${s.slug}`}
                      className="rounded-md border border-danger bg-danger-soft px-2.5 py-1 text-[13.5px] text-ink no-underline"
                    >
                      {s.title} ({map[s.slug]!.correct}/{map[s.slug]!.total})
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 mt-1 text-[15px] text-ink-2">
              ทุกชุดที่ทำผ่านเกณฑ์ 70% แล้ว — ทำชุดที่ยังไม่ได้ทำต่อได้เลย
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("ลบผลการฝึกทั้งหมดในเบราว์เซอร์นี้?")) reset();
            }}
            className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-3 hover:text-ink"
          >
            ล้างผลทั้งหมด
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-10">
        {[...byCourse.entries()].map(([course, list]) => (
          <section key={course}>
            <h2 className="m-0 mb-4 border-b-2 border-ink pb-2 font-display text-[20px] font-semibold text-ink">
              {course}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {list.map((s) => {
                const r = ready ? map[s.slug] : undefined;
                const pct = r ? Math.round((r.correct / r.total) * 100) : null;
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/practice/${s.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="m-0 font-display text-[16px] font-semibold text-ink">
                          {s.title}
                        </p>
                        <p className="m-0 font-mono text-[12px] text-ink-3">
                          {s.chapter} · {s.count} ข้อ
                          {s.numericCount > 0 ? ` · กรอกเอง ${s.numericCount}` : ""}
                        </p>
                      </div>
                      {pct !== null && r ? (
                        <span
                          className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[12px] ${
                            needsReview(r)
                              ? "border-danger bg-danger-soft text-ink"
                              : "border-ok bg-ok-soft text-ink"
                          }`}
                        >
                          {r.correct}/{r.total}
                        </span>
                      ) : (
                        <span className="shrink-0 font-mono text-[12px] text-ink-3">ยังไม่ทำ</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
