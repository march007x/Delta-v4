import type { Metadata } from "next";
import { PracticeIndex } from "@/components/practice/PracticeIndex";
import { getPracticeIndex } from "@/lib/repo/practice";

export const metadata: Metadata = {
  title: "ฝึกโจทย์",
  description:
    "ชุดโจทย์ฝึกแยกตามบท พร้อมเฉลยทีละข้อ และสรุปว่าบทไหนที่ควรกลับไปทบทวนก่อน",
};

export default function PracticeHubPage() {
  const sets = getPracticeIndex();
  const total = sets.reduce((n, s) => n + s.count, 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-9 border-b border-line pb-6">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          ฝึกและทบทวน
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ฝึกโจทย์
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] leading-relaxed text-ink-2">
          โจทย์ {total} ข้อจาก {sets.length} บท แยกเป็นชุดตามบทเรียน · สับลำดับใหม่ทุกครั้ง ·
          <strong className="font-semibold text-ink">ไม่เฉลยระหว่างทำ</strong>{" "}
          เฉลยทุกข้อขึ้นพร้อมกันเมื่อทำจบชุด ระหว่างทางกดขอแนวทางแบบไล่ระดับได้
        </p>
        <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-ink-3">
          ผลการฝึกเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ต้องสมัครสมาชิก และไม่ถูกส่งไปที่ใด —
          แปลว่าถ้าเปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์ ผลจะหายไป
        </p>
      </header>

      <PracticeIndex sets={sets} />
    </div>
  );
}
