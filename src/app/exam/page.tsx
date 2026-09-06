import type { Metadata } from "next";
import { ExamIndex } from "@/components/exam/ExamIndex";
import { getExamSets } from "@/lib/repo/exam";

export const metadata: Metadata = {
  title: "ข้อสอบจำลอง",
  description:
    "ข้อสอบจำลองแบบจับเวลา กระจายทุกบท ไม่เฉลยระหว่างทำ และสรุปจุดอ่อนรายบทเมื่อส่งคำตอบ",
};

export default function ExamHubPage() {
  const sets = getExamSets();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-9 border-b border-line pb-6">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          จำลองสนามสอบ
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ข้อสอบจำลอง
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          ต่างจากโหมดฝึกตรงที่ <strong className="font-semibold text-ink">จับเวลา</strong> และ{" "}
          <strong className="font-semibold text-ink">ไม่เฉลยระหว่างทำ</strong> —
          เพราะทักษะที่ใช้ในห้องสอบคือการตัดสินใจว่าจะข้ามข้อไหน และทนกับความไม่แน่ใจจนจบชุด
          ซึ่งฝึกไม่ได้เลยถ้าเฉลยเด้งขึ้นทุกข้อ
        </p>
        <div className="mt-4 rounded-lg border border-warn bg-warn-soft px-4 py-3 text-[14.5px] leading-relaxed text-ink">
          <strong className="font-semibold">ข้อสอบทุกชุดในหน้านี้เขียนขึ้นเอง</strong>{" "}
          โดยอ้างอิงขอบเขตเนื้อหาที่ประกาศเป็นสาธารณะ — ไม่ใช่ข้อสอบจริงจากสนามสอบใด
          และไม่ได้คัดลอกข้อสอบชุดใดมาทั้งสิ้น ใช้เพื่อฝึกจังหวะการทำข้อสอบและหาจุดอ่อนของตัวเองเท่านั้น
        </div>
      </header>

      <ExamIndex sets={sets} />
    </div>
  );
}
