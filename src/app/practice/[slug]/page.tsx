import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/practice/PracticeRunner";
import { getLessonBySlug, getPublishedLessons } from "@/lib/repo/content";
import { getPracticeSet } from "@/lib/repo/practice";

export function generateStaticParams() {
  return getPublishedLessons().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return { title: "ไม่พบชุดฝึก" };
  return {
    title: `ฝึกโจทย์ — ${lesson.title}`,
    description: `ชุดโจทย์ฝึกของบท ${lesson.title} ทำจนจบชุดแล้วเฉลยทุกข้อพร้อมคำอธิบายเป็นขั้นตอน`,
  };
}

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const set = getPracticeSet(lesson);
  if (set.questions.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <nav className="mb-5 font-mono text-[12.5px] text-ink-3">
        <Link href="/practice" className="text-ink-3 no-underline hover:text-ink">
          ฝึกโจทย์
        </Link>{" "}
        / {lesson.title}
      </nav>

      <h1 className="m-0 mb-5 font-display text-[clamp(24px,3.6vw,32px)] font-bold tracking-tight text-ink">
        ฝึกโจทย์ — {lesson.title}
      </h1>

      <PracticeRunner slug={set.slug} title={set.title} questions={set.questions} />

      <p className="mt-8 text-[14px] leading-relaxed text-ink-3">
        โจทย์ทุกข้อเขียนขึ้นใหม่จากขอบเขตเนื้อหาที่ประกาศเป็นสาธารณะ ไม่ได้คัดลอกจากข้อสอบชุดใด
      </p>
    </div>
  );
}
