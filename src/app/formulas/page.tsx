import type { Metadata } from "next";
import Link from "next/link";
import { StaticBlock } from "@/components/lesson/StaticBlocks";
import { countFormulas, getFormulaGroups } from "@/lib/repo/formulas";

export const metadata: Metadata = {
  title: "สรุปสูตรทั้งหมด",
  description:
    "ภาคผนวกสูตร กฎ และตารางจากทุกบทเรียน รวมไว้หน้าเดียว สั่งพิมพ์เป็นชีตทบทวนก่อนสอบได้",
};

export default function FormulasPage() {
  const groups = getFormulaGroups();
  const total = countFormulas(groups);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          ภาคผนวก
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          สรุปสูตรทั้งหมด
        </h1>
        <p className="m-0 max-w-[64ch] text-[16px] leading-relaxed text-ink-2">
          รวมกฎ นิยาม และตารางสรุปจากทุกบทเรียน {total} รายการไว้ที่เดียว
          หน้านี้ดึงมาจากเนื้อหาบทเรียนโดยตรง จึงตรงกันเสมอ ไม่มีทางที่สูตรสองที่จะไม่ตรงกัน
        </p>
        <p className="m-0 mt-3 text-[14.5px] text-ink-3">
          กด <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[12px]">
            Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[12px]">
            P
          </kbd>{" "}
          เพื่อพิมพ์เป็นชีตทบทวน · หรือกด{" "}
          <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[12px]">
            Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[12px]">
            F
          </kbd>{" "}
          เพื่อค้นหาในหน้านี้
        </p>
      </header>

      <nav
        aria-label="ข้ามไปยังระดับชั้น"
        className="mb-10 flex flex-wrap gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3"
      >
        <span className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
          ข้ามไป
        </span>
        {groups.map((g) => (
          <a
            key={g.course.id}
            href={`#f-${g.course.slug}`}
            className="rounded-md border border-line bg-surface px-2.5 py-1 text-[13.5px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            {g.course.title}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-14">
        {groups.map((group) => (
          <section key={group.course.id} id={`f-${group.course.slug}`} className="scroll-mt-20">
            <h2 className="m-0 mb-6 border-b-2 border-ink pb-2 font-display text-[22px] font-semibold text-ink">
              {group.course.title}
            </h2>

            <div className="flex flex-col gap-10">
              {group.entries.map((entry) => (
                <article key={entry.lesson.id}>
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                    <h3 className="m-0 font-display text-[18px] font-semibold text-ink">
                      {entry.lesson.title}
                    </h3>
                    <span className="font-mono text-[12px] text-ink-3">{entry.chapterTitle}</span>
                    <Link
                      href={`/lesson/${entry.lesson.slug}`}
                      className="ml-auto text-[13.5px] text-accent-ink no-underline hover:underline"
                    >
                      อ่านบทเต็ม →
                    </Link>
                  </div>

                  {entry.blocks.map((block, i) => (
                    <StaticBlock key={i} block={block} />
                  ))}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 rounded-lg border border-dashed border-line-strong bg-surface-2 px-5 py-4 text-[14.5px] leading-relaxed text-ink-3">
        หน้านี้มีไว้{" "}
        <strong className="font-semibold text-ink-2">ทบทวน</strong> ไม่ใช่ไว้เรียนครั้งแรก — สูตรที่จำได้แต่ไม่รู้ที่มา
        จะใช้ไม่เป็นเมื่อโจทย์เปลี่ยนรูป ถ้าเจอสูตรไหนที่นึกที่มาไม่ออก ให้กด “อ่านบทเต็ม” กลับไปดูขั้นที่มา
      </p>
    </div>
  );
}
