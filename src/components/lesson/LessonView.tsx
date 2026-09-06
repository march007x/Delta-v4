import Link from "next/link";
import type { Lesson, Topic } from "@/content/schema";
import { SECTION_LABEL } from "@/content/schema";
import { BlockRenderer } from "./BlockRenderer";
import { LessonCompleteButton } from "./LessonCompleteButton";
import { Badge } from "@/components/ui/Badge";
import { LessonChrome } from "./LessonChrome";

/** หน้าบทเรียน — เนื้อหายังคงเป็น server component เพื่อให้ KaTeX และเนื้อหาบทเรียนเรนเดอร์บนเซิร์ฟเวอร์ */
export function LessonView({
  lesson,
  topic,
  prerequisites,
  prev,
  next,
}: {
  lesson: Lesson;
  topic?: Topic;
  prerequisites: Topic[];
  prev?: Lesson;
  next?: Lesson;
}) {
  const practiceCount = lesson.sections
    .filter((s) => s.type === "guided" || s.type === "practice" || s.type === "challenge")
    .reduce(
      (n, s) => n + s.blocks.filter((b) => b.kind === "quiz" || b.kind === "numeric").length,
      0,
    );

  return (
    <article className="mx-auto max-w-[1400px] px-5 py-10 sm:px-6 lg:px-8">
      <LessonChrome
        sections={lesson.sections.map((section) => ({
          id: section.id,
          title: section.title ?? SECTION_LABEL[section.type],
        }))}
      >
        <div className="min-w-0">
          <header className="mb-8 border-b border-line pb-6">
            <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
              {topic ? topic.title : "บทเรียน"}
            </p>
            <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] leading-tight font-bold tracking-tight text-ink">
              {lesson.title}
            </h1>
            <p className="m-0 mb-4 max-w-[70ch] text-[16px] text-ink-2">{lesson.summary}</p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">ใช้เวลาราว {lesson.estimatedMinutes} นาที</Badge>
              <Badge tone="neutral">{lesson.sections.length} ขั้นตอน</Badge>
              {prerequisites.length > 0 ? (
                <span className="text-[13px] text-ink-3">
                  ควรแม่น{" "}
                  {prerequisites.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/lesson/${p.slug}`} className="text-accent-ink">
                        {p.title}
                      </Link>
                    </span>
                  ))}{" "}
                  มาก่อน
                </span>
              ) : null}
            </div>
          </header>

          {lesson.sections.map((section, i) => (
            <section key={section.id} id={section.id} className="mb-10 scroll-mt-20">
              <div className="mb-3 flex items-baseline gap-3 border-b-2 border-ink pb-2">
                <span className="font-mono text-[11.5px] text-accent-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="m-0 font-display text-[19px] font-semibold text-ink">
                  {section.title ?? SECTION_LABEL[section.type]}
                </h2>
              </div>
              {section.blocks.map((b, j) => (
                <BlockRenderer key={j} block={b} seed={`${lesson.slug}:${section.id}:${j}`} />
              ))}
            </section>
          ))}

          {practiceCount > 0 ? (
            <div className="mt-12 rounded-lg border border-accent bg-accent-soft p-6">
              <p className="m-0 mb-1 font-display text-[16px] font-semibold text-ink">
                ลองวัดว่าเข้าใจจริงไหม
              </p>
              <p className="m-0 mb-4 max-w-[56ch] text-[14.5px] text-ink-2">
                ชุดฝึก {practiceCount} ข้อของบทนี้ สับลำดับใหม่ทุกครั้ง เฉลยทีละข้อ
                และสรุปให้ตอนจบว่าพลาดตรงไหน — อ่านจบแล้วยังไม่พอ ต้องทำเองถึงจะรู้ว่าเข้าใจจริง
              </p>
              <Link
                href={`/practice/${lesson.slug}`}
                className="inline-block rounded-lg bg-ink px-4 py-2 text-[15px] font-medium text-bg no-underline hover:opacity-90"
              >
                เริ่มทำชุดฝึก →
              </Link>
            </div>
          ) : null}

          <div className="mt-6 rounded-lg border border-line bg-surface p-6">
            <p className="m-0 mb-1 font-display text-[16px] font-semibold text-ink">
              เรียนบทนี้จบแล้วหรือยัง
            </p>
            <p className="m-0 mb-4 max-w-[56ch] text-[14.5px] text-ink-3">
              การทำเครื่องหมายนี้บันทึกไว้ในเบราว์เซอร์ของคุณเอง ยังไม่มีระบบบัญชีผู้ใช้ —
              ถ้าล้างข้อมูลเบราว์เซอร์ ความก้าวหน้าจะหายไป
            </p>
            <LessonCompleteButton lessonId={lesson.id} />
          </div>

          <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="บทเรียนก่อนหน้าและถัดไป">
            {prev ? (
              <Link
                href={`/lesson/${prev.slug}`}
                className="rounded-lg border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
              >
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
                  ← บทก่อนหน้า
                </p>
                <p className="m-0 font-display text-[15px] font-semibold text-ink">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/lesson/${next.slug}`}
                className="rounded-lg border border-line bg-surface px-4 py-3 text-right no-underline hover:border-accent sm:col-start-2"
              >
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
                  บทถัดไป →
                </p>
                <p className="m-0 font-display text-[15px] font-semibold text-ink">{next.title}</p>
              </Link>
            ) : null}
          </nav>
        </div>
      </LessonChrome>
    </article>
  );
}
