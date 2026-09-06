import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3">
        <div>
          <p className="mb-1 font-display text-[15px] font-semibold text-ink">
            {SITE.symbol} {SITE.name}
          </p>
          <p className="mb-2 font-mono text-[11.5px] tracking-wide text-ink-3">{SITE.author}</p>
          <p className="m-0 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-3">{SITE.meaning}</p>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">เนื้อหา</p>
          <ul className="m-0 list-none space-y-1 p-0 text-[14px]">
            <li>
              <Link href="/courses" className="text-ink-2 no-underline hover:text-ink">
                หลักสูตรทั้งหมด
              </Link>
            </li>
            <li>
              <Link href="/progress" className="text-ink-2 no-underline hover:text-ink">
                ความก้าวหน้า
              </Link>
            </li>
            <li>
              <Link href="/practice" className="text-ink-2 no-underline hover:text-ink">
                ฝึกโจทย์
              </Link>
            </li>
            <li>
              <Link href="/exam" className="text-ink-2 no-underline hover:text-ink">
                ข้อสอบจำลอง
              </Link>
            </li>
            <li>
              <Link href="/playground" className="text-ink-2 no-underline hover:text-ink">
                ห้องทดลอง
              </Link>
            </li>
            <li>
              <Link href="/formulas" className="text-ink-2 no-underline hover:text-ink">
                สรุปสูตร
              </Link>
            </li>
            <li>
              <Link href="/search" className="text-ink-2 no-underline hover:text-ink">
                ค้นหา
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-ink-2 no-underline hover:text-ink">
                แนวทางการสอน
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-ink-2 no-underline hover:text-ink">
                ความเป็นส่วนตัว
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            เกี่ยวกับเนื้อหา
          </p>
          <p className="m-0 text-[13.5px] leading-relaxed text-ink-3">
            โจทย์ทั้งหมดในเว็บนี้เขียนขึ้นใหม่โดยอ้างอิงผังข้อสอบที่เผยแพร่สาธารณะ
            <b className="font-medium text-ink-2"> ไม่ใช่ข้อสอบจริงจากสนามสอบใด ๆ</b>
          </p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-4">
        <p className="mx-auto m-0 max-w-6xl font-mono text-[11.5px] text-ink-3">
          {SITE.name} · {SITE.author} · โครงการเพื่อการศึกษา
        </p>
      </div>
    </footer>
  );
}
