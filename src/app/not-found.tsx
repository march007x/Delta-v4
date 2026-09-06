import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="m-0 mb-3 font-mono text-[12px] uppercase tracking-[0.15em] text-ink-3">404</p>
      <h1 className="m-0 mb-3 font-display text-[28px] font-bold text-ink">ไม่พบหน้านี้</h1>
      <p className="m-0 mb-6 text-[16px] text-ink-2">
        หน้าที่คุณเปิดอาจถูกย้าย หรือเป็นบทเรียนที่ยังเขียนไม่เสร็จ
      </p>
      <Link
        href="/courses"
        className="inline-block rounded-lg bg-ink px-5 py-2.5 text-[15px] font-medium text-bg no-underline"
      >
        ดูบทเรียนที่เปิดแล้ว
      </Link>
    </div>
  );
}
