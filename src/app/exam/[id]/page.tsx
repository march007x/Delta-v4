import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { getExamSet, getExamSets } from "@/lib/repo/exam";

export function generateStaticParams() {
  return getExamSets().map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const set = getExamSet(id);
  if (!set) return { title: "ไม่พบชุดข้อสอบ" };
  return {
    title: set.title,
    description: `ข้อสอบจำลอง ${set.count} ข้อ ${set.minutes} นาที กระจายทุกบทของ${set.courseTitle} พร้อมสรุปจุดอ่อนรายบท`,
  };
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = getExamSet(id);
  if (!set) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <nav className="mb-5 font-mono text-[12.5px] text-ink-3">
        <Link href="/exam" className="text-ink-3 no-underline hover:text-ink">
          ข้อสอบจำลอง
        </Link>{" "}
        / {set.courseTitle} ชุดที่ {set.round}
      </nav>

      <h1 className="m-0 mb-5 font-display text-[clamp(24px,3.6vw,32px)] font-bold tracking-tight text-ink">
        {set.title}
      </h1>

      <ExamRunner
        meta={{
          id: set.id,
          title: set.title,
          courseTitle: set.courseTitle,
          courseSlug: set.courseSlug,
          round: set.round,
          count: set.count,
          minutes: set.minutes,
        }}
        questions={set.questions}
      />

      <p className="mt-8 text-[14px] leading-relaxed text-ink-3">
        นี่คือ <strong className="font-semibold text-ink-2">ข้อสอบจำลองที่เขียนขึ้นเอง</strong>{" "}
        จากขอบเขตเนื้อหาที่ประกาศเป็นสาธารณะ — ไม่ใช่ข้อสอบจริงจากสนามสอบใด
        และไม่ได้คัดลอกจากข้อสอบชุดใดทั้งสิ้น
      </p>
    </div>
  );
}
