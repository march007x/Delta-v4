import type { Metadata } from "next";
import { ProgressBoard } from "@/components/progress/ProgressBoard";
import { buildProgressIndex } from "@/lib/repo/progress-index";

export const metadata: Metadata = {
  title: "ความก้าวหน้า",
  description: "ดูว่าเรียนไปถึงไหน บทไหนยังไม่แน่น และควรทำอะไรต่อ",
};

export default function ProgressPage() {
  const lessons = buildProgressIndex();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-9 border-b border-line pb-6">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          เส้นทางของคุณ
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ความก้าวหน้า
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          รวมสิ่งที่บันทึกไว้ทั้งหมด — บทที่อ่านจบ ผลแบบฝึก และผลข้อสอบจำลอง —
          แล้วตอบคำถามเดียวว่า <strong className="font-semibold text-ink">ตอนนี้ควรทำอะไรต่อ</strong>{" "}
          โดยเรียงตามลำดับพื้นฐานที่วางไว้ ไม่ใช่เรียงตามหน้าหนังสือ
        </p>
        <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-ink-3">
          ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ต้องสมัครสมาชิก และไม่ถูกส่งไปที่ใด —
          ถ้าเปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์ ความก้าวหน้าจะหายไป
        </p>
      </header>

      <ProgressBoard lessons={lessons} />
    </div>
  );
}
