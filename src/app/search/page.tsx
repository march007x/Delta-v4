import type { Metadata } from "next";
import { SearchBox } from "@/components/search/SearchBox";
import { buildSearchIndex } from "@/lib/repo/search";

export const metadata: Metadata = {
  title: "ค้นหา",
  description: "ค้นหาบทเรียน สูตร และหัวข้อย่อยทั้งหมดในเว็บ",
};

export default function SearchPage() {
  const docs = buildSearchIndex();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-7">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          ค้นหา
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          หาเรื่องที่ต้องการ
        </h1>
        <p className="m-0 max-w-[60ch] text-[16px] text-ink-2">
          ค้นได้ทั้งชื่อบท ชื่อสูตร ชื่อกฎ และชื่อตารางสรุป — ค้นในเครื่องคุณเอง ไม่ส่งคำค้นไปที่ไหน
        </p>
      </header>

      <SearchBox docs={docs} />
    </div>
  );
}
