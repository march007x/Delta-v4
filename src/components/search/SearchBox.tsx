"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SearchDoc } from "@/lib/repo/search";

interface Hit {
  doc: SearchDoc;
  score: number;
  /** หัวข้อย่อยที่ตรงกับคำค้น — บอกผู้ใช้ว่าเจอที่ไหนในบท */
  matched: string[];
}

/** ตัดช่องว่างซ้ำและทำตัวพิมพ์เล็ก — ภาษาไทยไม่มีตัวพิมพ์ใหญ่เล็ก แต่คำอังกฤษปนมีได้ */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function search(docs: SearchDoc[], raw: string): Hit[] {
  const q = norm(raw);
  if (q.length < 2) return [];
  const terms = q.split(" ").filter(Boolean);

  const hits: Hit[] = [];
  for (const doc of docs) {
    const title = norm(doc.title);
    const summary = norm(doc.summary);
    const keysNorm = doc.keys.map(norm);

    let score = 0;
    const matched: string[] = [];

    for (const t of terms) {
      // ชื่อบทตรงเป๊ะได้คะแนนสูงสุด เพราะคนส่วนใหญ่ค้นด้วยชื่อเรื่อง
      if (title === t) score += 100;
      else if (title.includes(t)) score += 40;
      if (norm(doc.chapter).includes(t)) score += 20;
      if (summary.includes(t)) score += 10;
      if (norm(doc.course).includes(t)) score += 6;
      keysNorm.forEach((k, i) => {
        if (k.includes(t)) {
          score += 8;
          const original = doc.keys[i];
          if (original && !matched.includes(original)) matched.push(original);
        }
      });
    }

    if (score > 0) hits.push({ doc, score, matched: matched.slice(0, 4) });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 20);
}

const SUGGESTIONS = [
  "อนุพันธ์",
  "ลิมิต",
  "เมทริกซ์",
  "ดีเทอร์มิแนนต์",
  "เวกเตอร์",
  "กฎลูกโซ่",
  "ทริคการจำ",
  "จุดที่คนมักผิด",
];

export function SearchBox({ docs }: { docs: SearchDoc[] }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => search(docs, q), [docs, q]);
  const typed = q.trim().length >= 2;

  return (
    <div>
      <label htmlFor="site-search" className="sr-only">
        ค้นหาบทเรียน
      </label>
      <input
        id="site-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="พิมพ์ชื่อเรื่อง ชื่อสูตร หรือคำที่จำได้…"
        autoComplete="off"
        className="w-full rounded-lg border border-line-strong bg-surface px-4 py-3 text-[16px] text-ink outline-none placeholder:text-ink-3 focus:border-accent"
      />

      {!typed ? (
        <div className="mt-5">
          <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
            ลองค้นคำเหล่านี้
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQ(s)}
                className="rounded-md border border-line bg-surface px-2.5 py-1 text-[13.5px] text-ink-2 hover:border-line-strong hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : hits.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-4 text-[15px] text-ink-3">
          ไม่พบบทเรียนที่ตรงกับ “{q.trim()}” — ลองใช้คำสั้นลง หรือดู{" "}
          <Link href="/courses" className="text-accent-ink">
            หลักสูตรทั้งหมด
          </Link>{" "}
          ว่าเรื่องนั้นเปิดแล้วหรือยัง
        </p>
      ) : (
        <>
          <p className="mt-5 mb-2 font-mono text-[12px] text-ink-3">พบ {hits.length} บท</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {hits.map(({ doc, matched }) => (
              <li key={doc.slug}>
                <Link
                  href={`/lesson/${doc.slug}`}
                  className="block rounded-lg border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-display text-[16.5px] font-semibold text-ink">
                      {doc.title}
                    </span>
                    <span className="font-mono text-[11.5px] text-ink-3">
                      {doc.course} · {doc.chapter} · {doc.minutes} นาที
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink-2">{doc.summary}</p>
                  {matched.length > 0 ? (
                    <p className="m-0 mt-1.5 font-mono text-[12px] text-ink-3">
                      เจอใน: {matched.join(" · ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
