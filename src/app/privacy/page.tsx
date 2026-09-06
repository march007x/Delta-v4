import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "ความเป็นส่วนตัว",
  description: "ข้อมูลอะไรบ้างที่เว็บนี้เก็บและไม่เก็บ",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,36px)] font-bold tracking-tight text-ink">
          ความเป็นส่วนตัว
        </h1>
        <p className="m-0 text-[16px] text-ink-2">
          หน้านี้บอกตรง ๆ ว่า {SITE.name} เก็บอะไรและไม่เก็บอะไร — อ่านจบได้ในหนึ่งนาที
        </p>
      </header>

      <div className="rounded-lg border-l-[3px] border-l-ok bg-ok-soft px-5 py-4">
        <p className="m-0 font-display text-[16px] font-semibold text-ink">
          สรุปสั้นที่สุด: เราไม่เก็บข้อมูลส่วนตัวของคุณเลย
        </p>
        <p className="m-0 mt-1 text-[14.5px] leading-relaxed text-ink-2">
          เว็บนี้ยังไม่มีระบบสมาชิก ไม่มีการสมัคร ไม่มีการล็อกอิน และไม่มีฐานข้อมูลผู้ใช้
        </p>
      </div>

      <h2 className="mt-9 mb-2 font-display text-[19px] font-semibold text-ink">
        ข้อมูลที่ถูกบันทึก
      </h2>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        มีอย่างเดียวคือ <b className="text-ink">ความก้าวหน้าการเรียน</b> — บทไหนที่คุณกดว่าเรียนจบแล้ว
        ข้อมูลนี้ถูกเก็บไว้ใน <b className="text-ink">เบราว์เซอร์ของคุณเอง</b> ผ่าน localStorage
        มันไม่เคยถูกส่งออกไปที่เซิร์ฟเวอร์ใด ๆ และเราไม่มีทางเห็นมัน
      </p>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        ผลที่ตามมาคือ ถ้าคุณล้างข้อมูลเบราว์เซอร์ เปลี่ยนเครื่อง หรือเปิดในโหมดไม่ระบุตัวตน
        ความก้าวหน้าจะไม่ตามไปด้วย
      </p>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">ข้อมูลที่ไม่เก็บ</h2>
      <ul className="pl-5 text-[16px] leading-[1.8] text-ink-2">
        <li>ชื่อ อีเมล เบอร์โทร โรงเรียน หรือข้อมูลระบุตัวตนใด ๆ</li>
        <li>คำตอบที่คุณเลือกในควิซ — ตรวจในเบราว์เซอร์และไม่ถูกบันทึกไว้ที่ไหน</li>
        <li>ไม่มีระบบติดตามพฤติกรรม ไม่มีโฆษณา ไม่มีการขายข้อมูลให้ใคร</li>
      </ul>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">
        บริการภายนอกที่เว็บนี้เรียกใช้
      </h2>
      <ul className="pl-5 text-[16px] leading-[1.8] text-ink-2">
        <li>
          <b className="text-ink">Google Fonts</b> — ใช้โหลดฟอนต์ที่ใช้แสดงผล
          เบราว์เซอร์ของคุณจะติดต่อเซิร์ฟเวอร์ของ Google โดยตรงเพื่อดาวน์โหลดไฟล์ฟอนต์
        </li>
        <li>
          <b className="text-ink">ผู้ให้บริการโฮสต์</b> — เก็บบันทึกการเข้าถึงตามปกติของเซิร์ฟเวอร์เว็บ
          เช่นหมายเลขไอพีและหน้าที่เปิด ซึ่งเป็นสิ่งที่เว็บทุกเว็บมี
        </li>
      </ul>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">
        ถ้ามีระบบสมาชิกในอนาคต
      </h2>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        เมื่อใดที่เว็บนี้เพิ่มระบบบัญชีผู้ใช้ หน้านี้จะถูกแก้ก่อน และจะขอความยินยอมจากคุณอย่างชัดเจนก่อนเก็บข้อมูลใด ๆ
        แนวทางที่ตั้งใจถือไว้คือเก็บเท่าที่จำเป็นต่อการเรียนเท่านั้น และต้องลบบัญชีพร้อมข้อมูลทั้งหมดได้จริงเมื่อคุณต้องการ
      </p>

      <h2 className="mt-8 mb-2 font-display text-[19px] font-semibold text-ink">ลบข้อมูลของคุณ</h2>
      <p className="text-[16px] leading-[1.8] text-ink-2">
        เนื่องจากข้อมูลอยู่ในเบราว์เซอร์ของคุณเอง การล้างข้อมูลเว็บไซต์นี้ในตั้งค่าเบราว์เซอร์
        คือการลบทุกอย่างที่เว็บนี้เก็บไว้เกี่ยวกับคุณ ไม่ต้องติดต่อใครและไม่ต้องรออนุมัติ
      </p>

      <p className="mt-10 font-mono text-[12.5px] text-ink-3">
        ปรับปรุงล่าสุด: กันยายน 2569 · {SITE.name} เป็นโครงการเพื่อการศึกษา
      </p>
    </div>
  );
}
