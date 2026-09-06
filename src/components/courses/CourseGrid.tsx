"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/layout/Icon";
import { CourseArt } from "@/components/ui/CourseArt";
import { useProgress } from "@/lib/progress/store";

export interface CourseCard {
  slug: string;
  title: string;
  summary: string;
  level: string;
  courseId: string;
  lessonId?: string;
  ready: boolean;
  questionCount: number;
}

/**
 * ตะแกรงการ์ดบทเรียน + แถบกรองระดับชั้น + สรุปความก้าวหน้าด้านข้าง
 *
 * เป็น client component เพราะทั้งตัวกรองและความก้าวหน้าอยู่ในเครื่องผู้เรียน
 * (เก็บใน localStorage ไม่มีบัญชี ไม่ส่งออกไปไหน) — เซิร์ฟเวอร์จึงไม่มีทางรู้
 *
 * บนมือถือ: แถบกรองเลื่อนแนวนอนแทนการตัดบรรทัด และกล่องสรุปย้ายไปอยู่ล่างสุด
 * เพราะสิ่งที่คนเปิดมือถือมาต้องการก่อนคือ "รายการบท" ไม่ใช่ตัวเลขสรุป
 */
export function CourseGrid({
  cards,
  levels,
}: {
  cards: CourseCard[];
  levels: Array<{ id: string; label: string }>;
}) {
  const [filter, setFilter] = useState<string>("all");
  const { map, ready } = useProgress();

  const shown = useMemo(
    () =>
      filter === "all" ? cards : cards.filter((c) => c.courseId === filter),
    [cards, filter],
  );

  const stats = useMemo(() => {
    if (!ready) return { done: 0, doing: 0, none: cards.length, pct: 0 };
    let done = 0;
    let doing = 0;
    for (const c of cards) {
      const st = c.lessonId ? map[c.lessonId]?.status : undefined;
      if (st === "completed") done++;
      else if (st === "in_progress") doing++;
    }
    return {
      done,
      doing,
      none: cards.length - done - doing,
      pct: cards.length ? Math.round((done / cards.length) * 100) : 0,
    };
  }, [cards, map, ready]);

  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1">
        {/* แถบกรอง — เลื่อนแนวนอนได้บนจอแคบ ไม่ตัดบรรทัดจนดันเนื้อหาลง */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            className="flex w-max gap-2"
            role="group"
            aria-label="กรองตามระดับชั้น"
          >
            {[{ id: "all", label: "ทั้งหมด" }, ...levels].map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setFilter(l.id)}
                aria-pressed={filter === l.id}
                className={cx(
                  "shrink-0 rounded-full px-4 py-2 text-[14px] whitespace-nowrap transition-colors",
                  filter === l.id
                    ? "bg-ink font-medium text-bg"
                    : "border border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="m-0 font-display text-[19px] font-semibold text-ink">
            {filter === "all"
              ? "บทเรียนทั้งหมด"
              : levels.find((l) => l.id === filter)?.label}
          </h2>
          <p className="m-0 font-mono text-[12.5px] text-ink-3">
            {shown.length} บท
          </p>
        </div>

        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 2xl:grid-cols-3">
          {shown.map((c) => {
            const st =
              c.lessonId && ready ? map[c.lessonId]?.status : undefined;
            const pct =
              st === "completed" ? 100 : st === "in_progress" ? 45 : 0;
            const cls = cx(
              "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface no-underline transition-colors",
              c.ready ? "hover:border-line-strong" : "opacity-70",
            );
            const inner = (
              <>
                <span className="relative block">
                  <CourseArt seedText={c.title} height={140} />
                  <span className="absolute top-2.5 right-2.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[10.5px] tracking-wide text-white backdrop-blur">
                    {c.level}
                  </span>
                  {!c.ready ? (
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[10.5px] text-white backdrop-blur">
                      กำลังเขียน
                    </span>
                  ) : null}
                </span>

                <span className="flex flex-1 flex-col p-4">
                  <span className="mb-1 block font-display text-[16px] leading-snug font-semibold text-ink">
                    {c.title}
                  </span>
                  <span className="mb-3 block text-[13.5px] leading-relaxed text-ink-3">
                    {c.summary}
                  </span>

                  <span className="mt-auto block">
                    {c.ready ? (
                      <span className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11.5px] text-ink-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="book" size={13} /> 14 ขั้นตอน
                        </span>
                        {c.questionCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="pencil" size={13} /> {c.questionCount}{" "}
                            ข้อ
                          </span>
                        ) : null}
                      </span>
                    ) : null}

                    <span className="flex items-center gap-3">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <span
                          className="block h-full rounded-full bg-accent transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="w-9 shrink-0 text-right font-mono text-[11.5px] text-ink-3">
                        {pct}%
                      </span>
                      {c.ready ? (
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line text-ink-2 group-hover:border-line-strong group-hover:text-ink">
                          <Icon name="chevron" size={14} />
                        </span>
                      ) : null}
                    </span>
                  </span>
                </span>
              </>
            );
            return (
              <li key={c.slug}>
                {c.ready ? (
                  <Link href={`/lesson/${c.slug}`} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* กล่องสรุป — ด้านขวาบนจอกว้าง · ล่างสุดบนมือถือ */}
      <aside className="w-full shrink-0 xl:w-72">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="m-0 mb-4 font-display text-[15px] font-semibold text-ink">
            เรียนจบแล้ว
          </p>
          <div className="flex items-center gap-4">
            <Ring pct={stats.pct} />
            <p className="m-0 text-[13.5px] leading-relaxed text-ink-3">
              {stats.done}/{cards.length}
              <br />
              บทที่เรียนจบ
            </p>
          </div>

          <p className="m-0 mt-5 mb-2.5 font-display text-[15px] font-semibold text-ink">
            สถิติการเรียน
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {[
              { icon: "clock", label: "กำลังเรียน", n: stats.doing },
              { icon: "check", label: "เรียนจบแล้ว", n: stats.done },
              { icon: "book", label: "ยังไม่เริ่ม", n: stats.none },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-2.5 text-[14px] text-ink-2"
              >
                <Icon name={row.icon as "clock"} size={15} />
                <span className="flex-1">{row.label}</span>
                <span className="font-mono text-[14px] text-ink">{row.n}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="m-0 mt-4 rounded-xl border border-line bg-surface p-5 text-[14.5px] leading-relaxed text-ink-2">
          “ก้าวเล็ก ๆ ในวันนี้ คือความเก่งในวันหน้า”
          <span className="mt-2 block font-mono text-[11px] tracking-wide text-ink-3">
            — DELTA
          </span>
        </p>
      </aside>
    </div>
  );
}

/** วงความก้าวหน้า — วาดด้วย SVG วงเดียว ไม่ต้องพึ่งไลบรารีกราฟทั้งก้อน */
function Ring({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      role="img"
      aria-label={`เรียนจบ ${pct}%`}
    >
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--surface-3)"
        strokeWidth="6"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--lime)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        fill="var(--ink)"
        fontSize="14"
        fontFamily="var(--font-mono)"
      >
        {pct}%
      </text>
    </svg>
  );
}
