import type { Metadata } from "next";
import { SECTION_LABEL, SECTION_TYPES } from "@/content/schema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "แนวทางการสอน",
  description: "ลำดับ 13 ขั้นที่ทุกบทเรียนใช้ และหลักการที่อยู่เบื้องหลัง",
};

const WHY: Record<string, string> = {
  motivation: "ถ้าไม่รู้ว่าเรียนไปทำไม สมองจะไม่เก็บมันไว้",
  intuition: "สร้างภาพในหัวก่อน แล้วสูตรจะเป็นแค่การเขียนภาพนั้นให้สั้นลง",
  visualization: "สิ่งที่ค้นพบเองด้วยการลองปรับค่า จำได้นานกว่าสิ่งที่อ่านผ่านตา",
  definition: "หลังจากเห็นภาพแล้ว นิยามที่รัดกุมจะอ่านเข้าใจ ไม่ใช่ท่องจำ",
  derivation: "การเห็นที่มาทำให้ลืมสูตรแล้วสร้างใหม่ได้ในห้องสอบ",
  example: "เห็นวิธีคิดทีละขั้น พร้อมเหตุผลของแต่ละขั้น",
  guided: "ลองเองโดยยังมีคำใบ้ให้ ถ้าติด",
  practice: "ลองเองล้วน ๆ เพื่อวัดว่าเข้าใจจริงหรือแค่ตามได้",
  challenge: "โจทย์ที่ต้องรวมหลายแนวคิด — จุดที่ความเข้าใจจริงกับการจำแยกออกจากกัน",
  examApplication: "แปลงความเข้าใจให้เป็นความเร็วในห้องสอบ",
  mnemonic: "วิธีจำที่ผูกกับความหมาย ไม่ใช่การท่องลอย ๆ — ใช้ตอนที่เข้าใจแล้วเท่านั้น",
  mistakes: "รู้จุดพลาดล่วงหน้า ดีกว่าไปพลาดเองในสนามจริง",
  summary: "เก็บใจความไว้ทบทวนก่อนสอบ",
  connection: "ผูกเรื่องนี้เข้ากับเรื่องอื่น เพื่อไม่ให้ความรู้เป็นก้อน ๆ ที่ไม่ต่อกัน",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          แนวทางการสอนของ {SITE.name}
        </h1>
        <p className="m-0 text-[16px] text-ink-2">{SITE.meaning}</p>
      </header>

      <p className="text-[16px] leading-[1.8] text-ink-2">
        หลักการเดียวที่คุมทุกอย่างคือ <b className="text-ink">อย่าเริ่มจากสูตร</b>{" "}
        ทุกบทเรียนจึงเดินตามลำดับ 14 ขั้นเหมือนกันหมด และลำดับนี้ไม่ได้ตั้งขึ้นเพื่อความสวยงาม
        แต่เพราะแต่ละขั้นแก้ปัญหาที่ต่างกัน
      </p>

      <ol className="m-0 mt-6 flex list-none flex-col gap-0 p-0">
        {SECTION_TYPES.map((t, i) => (
          <li key={t} className="grid grid-cols-[38px_1fr] gap-4 border-b border-line py-4">
            <span className="pt-1 font-mono text-[12px] text-accent-ink tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="m-0 font-display text-[16px] font-semibold text-ink">
                {SECTION_LABEL[t]}
              </p>
              <p className="m-0 text-[14.5px] leading-relaxed text-ink-3">{WHY[t]}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-lg border-l-[3px] border-l-accent bg-accent-soft px-5 py-4">
        <p className="m-0 mb-1 font-display text-[15px] font-semibold text-ink">
          ขอบเขตเนื้อหาอิงหลักสูตรแกนกลาง
        </p>
        <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">
          หัวข้อ ลำดับการสอน และระดับความลึกของแต่ละบท อ้างอิงขอบเขตของหนังสือเรียนรายวิชาพื้นฐานและเพิ่มเติม
          คณิตศาสตร์ ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน เพื่อให้เรียนคู่กับในห้องเรียนได้พอดี
          แต่<b className="font-medium text-ink"> คำอธิบาย ตัวอย่าง และโจทย์ทั้งหมดเขียนขึ้นใหม่เอง</b>
          ไม่ได้คัดลอกข้อความจากหนังสือเล่มใด
        </p>
      </div>

      <div className="mt-4 rounded-lg border-l-[3px] border-l-warn bg-warn-soft px-5 py-4">
        <p className="m-0 mb-1 font-display text-[15px] font-semibold text-ink">
          เรื่องโจทย์และข้อสอบ
        </p>
        <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">
          โจทย์ทุกข้อในเว็บนี้เขียนขึ้นใหม่เอง โดยอ้างอิงจากผังข้อสอบและขอบเขตเนื้อหาที่เผยแพร่สาธารณะ
          เราไม่นำข้อสอบจริงจากสนามสอบใดมาเผยแพร่ซ้ำ เพราะข้อสอบเหล่านั้นเป็นลิขสิทธิ์ของหน่วยงานผู้จัดสอบ
          และจะไม่มีการเรียกโจทย์ที่เราแต่งเองว่าเป็น “ข้อสอบจริง” ไม่ว่ากรณีใด
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-surface px-5 py-4">
        <p className="m-0 mb-1 font-display text-[15px] font-semibold text-ink">
          สถานะของเว็บตอนนี้
        </p>
        <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">
          เวอร์ชัน 0.1 — ยังไม่มีระบบบัญชีผู้ใช้ ความก้าวหน้าถูกบันทึกไว้ในเบราว์เซอร์ของคุณเอง
          ระบบคลังโจทย์ การจับเวลาสอบ และการวิเคราะห์จุดอ่อน อยู่ในแผนของเฟสถัดไป
        </p>
      </div>
    </div>
  );
}
