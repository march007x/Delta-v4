import type { Metadata } from "next";
import { InteractiveQuadratic } from "@/components/viz/InteractiveQuadratic";
import { InteractiveGraph } from "@/components/viz/InteractiveGraph";
import { InteractiveDerivative } from "@/components/viz/InteractiveDerivative";
import { InteractiveUnitCircle } from "@/components/viz/InteractiveUnitCircle";
import { InteractiveVenn } from "@/components/viz/InteractiveVenn";
import { InteractiveNumberLine } from "@/components/viz/InteractiveNumberLine";
import { InteractiveTruthTable } from "@/components/viz/InteractiveTruthTable";
import { InteractiveAnalyticGeometry } from "@/components/viz/InteractiveAnalyticGeometry";
import { InteractiveSequence } from "@/components/viz/InteractiveSequence";
import { InteractiveProbability } from "@/components/viz/InteractiveProbability";
import { InteractiveVector } from "@/components/viz/InteractiveVector";
import { InteractiveComplexPlane } from "@/components/viz/InteractiveComplexPlane";
import { InteractiveStatistics } from "@/components/viz/InteractiveStatistics";
import { InteractiveLimit } from "@/components/viz/InteractiveLimit";
import { InteractiveExtrema } from "@/components/viz/InteractiveExtrema";
import { InteractiveIntegral } from "@/components/viz/InteractiveIntegral";
import { InteractiveMatrix } from "@/components/viz/InteractiveMatrix";
import { InteractiveTriangle } from "@/components/viz/InteractiveTriangle";

export const metadata: Metadata = {
  title: "ห้องทดลอง",
  description: "กราฟโต้ตอบทุกตัวรวมไว้ที่เดียว ปรับค่าแล้วดูผลทันที",
};

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          Interactive
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          ห้องทดลอง
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] text-ink-2">
          กราฟทุกตัวที่นี่คำนวณสดจากค่าที่คุณปรับ ไม่ใช่ภาพที่เตรียมไว้ล่วงหน้า
          ลากได้ทั้งด้วยเมาส์และนิ้ว และเลื่อนด้วยปุ่มลูกศรบนคีย์บอร์ดก็ได้
        </p>
      </header>

      <InteractiveQuadratic />
      <InteractiveLimit />
      <InteractiveDerivative />
      <InteractiveExtrema />
      <InteractiveIntegral />
      <InteractiveUnitCircle />
      <InteractiveTriangle />
      <InteractiveMatrix />
      <InteractiveVenn />
      <InteractiveNumberLine />
      <InteractiveAnalyticGeometry />
      <InteractiveSequence />
      <InteractiveProbability />
      <InteractiveVector />
      <InteractiveComplexPlane />
      <InteractiveStatistics />
      <InteractiveTruthTable />
      <InteractiveGraph family="vertexForm" />
      <InteractiveGraph family="linear" />
      <InteractiveGraph family="absolute" />
      <InteractiveGraph family="reciprocal" />
      <InteractiveGraph family="exponential" />
      <InteractiveGraph family="sine" />

      <p className="mt-8 rounded-lg border border-dashed border-line-strong bg-surface-2 px-5 py-4 text-[14.5px] leading-relaxed text-ink-3">
        กำลังพัฒนาต่อ: ปริมาตรของรูปหมุน · การประมาณค่าด้วยอนุกรมเทย์เลอร์ —
        ทั้งหมดสร้างบนแกนกลางเดียวกับกราฟข้างบน
      </p>
    </div>
  );
}
