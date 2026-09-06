import Link from "next/link";
import { InteractiveQuadratic } from "@/components/viz/InteractiveQuadratic";
import { getCourses, getPublishedLessons, getTopics, getChapters } from "@/lib/repo/content";
import { getPracticeIndex } from "@/lib/repo/practice";
import { SITE } from "@/lib/site";
import { Badge } from "@/components/ui/Badge";

/**
 * หน้าต้อนรับ — ประตูหน้าแรกของทั้งระบบ
 *
 * คนที่เปิดเว็บนี้ครั้งแรกยังไม่รู้ว่ามันคืออะไร ทำไมต้องใช้ และใช่ของตัวเองหรือเปล่า
 * หน้านี้จึงตอบสามคำถามนั้นให้จบก่อน แล้วค่อยส่งเข้าไปข้างใน
 * โครงหน้า: ทักทาย → สร้างเพื่อใคร → มีไว้ทำไม → ทำงานยังไง → มีอะไรอยู่ข้างใน → เส้นทาง → สัญญา → เข้าใช้งาน
 */

const FOR_WHOM = [
  {
    who: "นักเรียน ม.4 – ม.6",
    detail: "เรียนตามหลักสูตรอยู่แล้ว แต่อยากเข้าใจว่าสูตรแต่ละตัวมาจากไหน ไม่ใช่แค่จำไปสอบ",
  },
  {
    who: "คนที่กำลังเตรียม A-Level / TPAT3",
    detail: "ต้องการโจทย์ที่ยากพอ พร้อมเฉลยที่บอกว่าทำไมตัวเลือกอื่นถึงผิด ไม่ใช่บอกแค่ข้อไหนถูก",
  },
  {
    who: "คนที่พื้นฐานหายไปบางช่วง",
    detail: "รู้ตัวว่าไม่เข้าใจ แต่ไม่รู้ว่าต้องย้อนกลับไปบทไหน — ทุกบทที่นี่บอกชัดว่าต้องแม่นอะไรมาก่อน",
  },
  {
    who: "ครู ผู้ปกครอง และคนที่สอนตัวเอง",
    detail: "หยิบกราฟโต้ตอบไปใช้ประกอบการอธิบายได้ทันที ไม่ต้องสมัคร ไม่ต้องติดตั้งอะไร",
  },
];

const PAINS = [
  { q: "จำสูตรได้ แต่พอเจอโจทย์แล้วไม่รู้ว่าจะใช้สูตรไหน", why: "เพราะเรียนสูตรมาโดยไม่เคยเห็นว่ามันมาจากไหน" },
  { q: "ทำตามตัวอย่างได้ แต่เปลี่ยนโจทย์นิดเดียวก็ตัน", why: "เพราะจำวิธีทำ ไม่ได้จำเหตุผลของแต่ละขั้น" },
  { q: "เห็นกราฟแล้วนึกภาพไม่ออกว่ามันหมายถึงอะไร", why: "เพราะเคยเห็นแต่ภาพนิ่ง ไม่เคยได้ลองขยับมันเอง" },
  { q: "รู้ว่าตัวเองไม่เข้าใจ แต่ไม่รู้ว่าต้องกลับไปเรียนบทไหน", why: "เพราะไม่มีใครบอกว่าเรื่องไหนเป็นพื้นฐานของเรื่องไหน" },
];

const LOOP = [
  { step: "เรียน", detail: "เริ่มจากคำถามว่าทำไมต้องมีแนวคิดนี้ ไม่ได้เริ่มจากสูตร" },
  { step: "เห็นภาพ", detail: "ปรับค่าเองแล้วดูกราฟตอบสนองทันที" },
  { step: "พิสูจน์", detail: "ไล่ที่มาของสูตรทีละบรรทัดจนเห็นว่ามันไม่ได้ลอยมา" },
  { step: "ฝึก", detail: "ทำโจทย์จนจบชุด แล้วค่อยเฉลยทุกข้อพร้อมเหตุผล" },
  { step: "ทบทวน", detail: "รู้ว่าจุดไหนพลาดบ่อย และควรกลับไปดูอะไร" },
];

const COMPARE: Array<[string, string]> = [
  ["ท่องสูตรไว้ก่อน เข้าใจทีหลัง", "เข้าใจก่อน แล้วสูตรจะจำได้เอง"],
  ["ภาพนิ่งในหนังสือ", "กราฟที่ลากได้ ปรับค่าได้ คำนวณสด"],
  ["โจทย์แยกเล่มจากบทเรียน", "โจทย์อยู่ในบทเรียน ตรงจุดที่เพิ่งอธิบายจบ"],
  ["กดปุ๊บเฉลยปั๊บ เลยไม่ได้คิดจริง", "ทำให้จบชุดก่อน ถึงเฉลยทุกข้อ"],
  ["เฉลยบอกแค่ว่าตอบข้อไหน", "เฉลยบอกว่าทำไมข้ออื่นถึงผิด"],
  ["ตันแล้วต้องเปิดเฉลยทั้งหมด", "ปุ่มขอแนวทางที่ค่อย ๆ ใบ้ทีละขั้น"],
  ["ไม่รู้ว่าพื้นฐานตรงไหนหาย", "ทุกบทบอกชัดว่าต้องแม่นอะไรมาก่อน"],
];

const JOURNEY = ["ปรับพื้นฐาน", "ม.4", "ม.5", "ม.6", "A-Level / TPAT3", "มหาวิทยาลัย"];

const PROMISES = [
  {
    title: "ฟรี และไม่ต้องสมัครสมาชิก",
    detail: "เปิดแล้วใช้ได้เลย ไม่มีบัญชี ไม่มีค่าใช้จ่าย ไม่มีทดลองใช้แล้วเก็บเงินทีหลัง",
  },
  {
    title: "ไม่เก็บข้อมูลส่วนตัว",
    detail: "ความก้าวหน้าและคะแนนถูกเก็บไว้ในเครื่องของคุณเองเท่านั้น ไม่ถูกส่งออกไปไหน",
  },
  {
    title: "ไม่มีข้อสอบเก่าที่ไม่มีสิทธิ์",
    detail: "โจทย์ทุกข้อเขียนขึ้นใหม่ตามผังการออกข้อสอบที่ประกาศต่อสาธารณะ ไม่ได้คัดลอกข้อสอบจริงมา",
  },
  {
    title: "ใช้ได้ทุกเครื่อง",
    detail: "Windows · macOS · iOS · Android · Linux — เปิดผ่านเบราว์เซอร์อะไรก็ได้ ไม่ต้องติดตั้ง",
  },
];

export default function WelcomePage() {
  const courses = getCourses();
  const published = getPublishedLessons();
  const practice = getPracticeIndex();
  const questionCount = practice.reduce((n, s) => n + s.count, 0);
  const numericCount = practice.reduce((n, s) => n + s.numericCount, 0);

  const STATS = [
    { n: String(published.length), label: "บทเรียนที่เปิดแล้ว" },
    { n: String(questionCount), label: "โจทย์ฝึก" },
    { n: String(numericCount), label: "ข้อกรอกคำตอบเอง" },
    { n: "25", label: "กราฟโต้ตอบ" },
  ];

  return (
    <>
      {/* ---------- 1. หน้าต้อนรับเต็มจอ ---------- */}
      <section className="on-hero screen-h relative flex flex-col overflow-hidden bg-hero-bg text-hero-ink">
        {/* ภาพพื้นหลัง — เปลี่ยนภาพได้โดยรันสคริปต์ scripts/prepare-hero.py ทับไฟล์เดิม
            ถ้าไฟล์หาย หน้าจะเหลือพื้นสีเข้มซึ่งยังอ่านได้ปกติ ไม่พัง */}
        <img
          src="/hero-1600.webp"
          srcSet="/hero-900.webp 900w, /hero-1600.webp 1600w, /hero-2400.webp 2400w"
          sizes="100vw"
          alt=""
          aria-hidden
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
        />
        {/* ม่านไล่สี — ภาพสวยแค่ไหนก็ไม่มีความหมายถ้าตัวหนังสือทับแล้วอ่านไม่ออก
            ไล่เข้มจากซ้าย (ฝั่งที่มีข้อความ) และเข้มที่ขอบบน-ล่างเพื่อรับแถบเมนูกับแถบท้าย */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(4,7,14,0.90) 0%, rgba(4,7,14,0.76) 30%, rgba(4,7,14,0.34) 58%, rgba(4,7,14,0.22) 100%)," +
              "linear-gradient(180deg, rgba(4,7,14,0.70) 0%, rgba(4,7,14,0.06) 24%, rgba(4,7,14,0.06) 60%, rgba(4,7,14,0.82) 100%)",
          }}
        />

        <div className="hero-stack relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12 sm:px-8 sm:py-20">
          <p className="hero-eyebrow m-0 mb-8">
            <span className="inline-block rounded-lg border border-hero-line px-3.5 py-1.5 font-mono text-[11px] tracking-[0.14em] text-hero-ink-2 uppercase">
              {SITE.symbol} Interactive Mathematics
            </span>
          </p>

          <h1 className="m-0 font-display text-[clamp(44px,min(15vw,17vh),132px)] leading-[0.9] font-medium tracking-[-0.02em] text-hero-ink">
            {SITE.name}
          </h1>

          <p className="hero-tagline m-0 mt-4 max-w-[24ch] font-display text-[clamp(21px,4.4vw,36px)] leading-[1.3] font-normal tracking-[-0.01em] text-hero-ink-2 text-balance sm:max-w-[28ch]">
            เข้าใจคณิตศาสตร์ด้วยการทดลอง ไม่ใช่การท่องจำ
          </p>

          <p className="hero-lede m-0 mt-5 max-w-[48ch] text-[clamp(15px,2.2vw,18px)] leading-relaxed text-hero-ink-2">
            แพลตฟอร์มเรียนคณิตศาสตร์แบบโต้ตอบสำหรับ ม.4 ถึงมหาวิทยาลัย
            <br className="hidden sm:block" /> ปรับค่าเองแล้วเห็นกราฟขยับทันที
            เข้าใจที่มาของทุกสูตรก่อนจะท่องมัน
          </p>

          <div className="hero-actions mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-lg bg-hero-cta px-8 py-4 text-center text-[17px] font-semibold text-hero-cta-ink no-underline transition-opacity hover:opacity-90 sm:py-3.5"
            >
              เข้าสู่บทเรียน
            </Link>
            <a
              href="#about"
              className="inline-flex items-center justify-center rounded-lg border border-hero-line px-8 py-4 text-center text-[17px] font-medium text-hero-ink no-underline transition-colors hover:border-hero-ink-3 sm:py-3.5"
            >
              นี่คืออะไร
            </a>
          </div>

          <p className="hero-note m-0 mt-7 font-mono text-[11.5px] tracking-wide text-hero-ink-3">
            ฟรี · ไม่ต้องสมัครสมาชิก · ใช้ได้ทุกระบบปฏิบัติการ
          </p>
        </div>

        <div className="relative border-t border-hero-line">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 sm:px-8">
            <p className="m-0 font-mono text-[11.5px] text-hero-ink-3">{SITE.author}</p>
            <a
              href="#about"
              aria-label="เลื่อนลงเพื่ออ่านรายละเอียด"
              className="m-0 font-mono text-[11.5px] text-hero-ink-3 no-underline hover:text-hero-ink-2"
            >
              เลื่อนลงเพื่ออ่านต่อ ↓
            </a>
          </div>
        </div>
      </section>

      {/* ---------- 2. นี่คืออะไร ---------- */}
      <section id="about" className="scroll-mt-16 border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="m-0 mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.13em] text-ink-3 uppercase before:h-px before:w-8 before:bg-line-strong before:content-['']">
            นี่คืออะไร
          </p>
          <h2 className="m-0 mb-5 max-w-[20ch] font-display text-[clamp(28px,4.6vw,44px)] leading-[1.14] font-medium tracking-[-0.015em] text-ink text-balance">
            เว็บเรียนคณิตศาสตร์ที่ให้คุณลองขยับมันเอง ก่อนจะเจอสูตร
          </h2>
          <p className="m-0 max-w-[62ch] text-[clamp(16px,2.2vw,18px)] leading-relaxed text-ink-2">
            {SITE.name} คือชุดบทเรียนคณิตศาสตร์ที่เขียนขึ้นใหม่ทั้งหมด โดยยึดหลักเดียว —{" "}
            <b className="font-semibold text-ink">
              สิ่งที่คุณค้นพบเองด้วยมือ จะอยู่กับคุณนานกว่าสิ่งที่ท่องมา
            </b>{" "}
            ทุกบทจึงเริ่มจากคำถามว่าทำไมต้องมีเรื่องนี้ ให้คุณลากกราฟดูก่อน แล้วค่อยพาไปเจอนิยาม
            ไล่ที่มาของสูตรทีละบรรทัด และปิดท้ายด้วยโจทย์ที่มีเฉลยบอกเหตุผล
          </p>

          <dl className="m-0 mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="m-0">
                  <span className="block font-display text-[clamp(34px,6.4vw,52px)] leading-none font-medium tracking-[-0.02em] text-ink">
                    {s.n}
                  </span>
                  <span className="mt-2 block text-[14px] leading-snug text-ink-3">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- 3. สร้างเพื่อใคร ---------- */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
        <p className="m-0 mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.13em] text-ink-3 uppercase before:h-px before:w-8 before:bg-line-strong before:content-['']">
          สร้างเพื่อใคร
        </p>
        <h2 className="m-0 mb-9 max-w-[24ch] font-display text-[clamp(26px,4vw,38px)] leading-[1.16] font-medium tracking-[-0.015em] text-ink text-balance">
          ถ้าคุณอยู่ในสี่กลุ่มนี้ เว็บนี้สร้างมาเพื่อคุณ
        </h2>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {FOR_WHOM.map((f) => (
            <div key={f.who} className="bg-surface p-6 sm:p-7">
              <h3 className="m-0 mb-2 font-display text-[17px] leading-snug font-semibold text-ink">
                {f.who}
              </h3>
              <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 4. มีไว้ทำไม ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="m-0 mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.13em] text-ink-3 uppercase before:h-px before:w-8 before:bg-line-strong before:content-['']">
            มีไว้ทำไม
          </p>
          <h2 className="m-0 mb-9 max-w-[26ch] font-display text-[clamp(26px,4vw,38px)] leading-[1.16] font-medium tracking-[-0.015em] text-ink text-balance">
            ปัญหาส่วนใหญ่ไม่ได้อยู่ที่ความขยัน แต่อยู่ที่ลำดับการเรียน
          </h2>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {PAINS.map((p) => (
              <div key={p.q} className="bg-surface p-6 sm:p-7">
                <p className="m-0 mb-2.5 font-display text-[16.5px] leading-snug font-semibold text-ink">
                  “{p.q}”
                </p>
                <p className="m-0 text-[14.5px] leading-relaxed text-ink-3">{p.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 5. ทำงานยังไง ---------- */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
        <p className="m-0 mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.13em] text-ink-3 uppercase before:h-px before:w-8 before:bg-line-strong before:content-['']">
          ทำงานยังไง
        </p>
        <h2 className="m-0 mb-4 font-display text-[clamp(26px,4vw,38px)] leading-[1.16] font-medium tracking-[-0.015em] text-ink">
          ทุกบทเดินตามลำดับเดียวกัน
        </h2>
        <p className="m-0 mb-9 max-w-[58ch] text-[16px] leading-relaxed text-ink-2">
          ลำดับนี้ไม่ได้ตั้งขึ้นลอย ๆ — มันคือลำดับที่ทำให้สัญลักษณ์ทุกตัวถูกอธิบายก่อนถูกใช้
          และทำให้คุณได้ลองคิดเองก่อนเสมอ
        </p>
        <ol className="m-0 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2 lg:grid-cols-5">
          {LOOP.map((l, i) => (
            <li key={l.step} className="bg-surface p-5 sm:p-6">
              <p className="m-0 mb-2 font-mono text-[11px] text-accent">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="m-0 mb-1.5 font-display text-[16px] font-semibold text-ink">{l.step}</p>
              <p className="m-0 text-[13.5px] leading-relaxed text-ink-3">{l.detail}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-lg border border-line bg-surface p-4 sm:p-6">
          <p className="m-0 mb-4 font-mono text-[11.5px] text-ink-3">
            ลองเลื่อนค่าดูก่อนได้เลย — นี่คือกราฟจริงจากบทฟังก์ชันกำลังสอง
          </p>
          <InteractiveQuadratic height={300} />
        </div>
      </section>

      {/* ---------- 6. ต่างจากแบบเดิมตรงไหน ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
          <h2 className="m-0 mb-9 font-display text-[clamp(26px,4vw,38px)] leading-[1.16] font-medium tracking-[-0.015em] text-ink">
            ต่างจากการเรียนแบบเดิมตรงไหน
          </h2>
          <div className="overflow-x-auto rounded-lg border border-line bg-bg">
            <table className="w-full min-w-[520px] border-collapse text-[15px]">
              <thead>
                <tr>
                  <th className="w-1/2 border-b border-line-strong bg-surface-2 px-5 py-3.5 text-left font-mono text-[10.5px] tracking-[0.1em] text-ink-3 uppercase">
                    การเรียนแบบเดิม
                  </th>
                  <th className="border-b border-line-strong bg-surface-2 px-5 py-3.5 text-left font-mono text-[10.5px] tracking-[0.1em] text-accent uppercase">
                    {SITE.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([a, b]) => (
                  <tr key={a}>
                    <td className="border-b border-line px-5 py-3.5 align-top text-ink-3">{a}</td>
                    <td className="border-b border-line px-5 py-3.5 align-top font-medium text-ink">
                      {b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------- 7. เส้นทาง + หลักสูตร ---------- */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
        <p className="m-0 mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.13em] text-ink-3 uppercase before:h-px before:w-8 before:bg-line-strong before:content-['']">
          เส้นทางที่วางไว้
        </p>
        <h2 className="m-0 mb-6 font-display text-[clamp(26px,4vw,38px)] leading-[1.16] font-medium tracking-[-0.015em] text-ink">
          เริ่มตรงไหนก็ได้ ไม่ต้องเริ่มจากศูนย์เสมอไป
        </h2>
        <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
          {JOURNEY.map((j, i) => (
            <li key={j} className="flex items-center gap-2">
              <span className="rounded-lg border border-line-strong bg-surface px-3.5 py-1.5 text-[14px] text-ink">
                {j}
              </span>
              {i < JOURNEY.length - 1 ? (
                <span aria-hidden className="font-mono text-ink-3">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="m-0 mt-5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-3">
          ตอนนี้เปิดแล้ว {published.length} บทเรียน — บทที่เปิดแล้วจะสมบูรณ์ครบทุกขั้นตอนการสอนเสมอ
          ไม่มีบทที่เปิดมาแล้วค้างครึ่งทาง
        </p>

        <div className="mt-10 grid gap-px border border-line bg-line lg:grid-cols-3">
          {courses.map((c) => {
            const chapterCount = getChapters(c.id).length;
            const topicCount = getChapters(c.id).reduce((n, ch) => n + getTopics(ch.id).length, 0);
            return (
              <Link
                key={c.id}
                href={`/courses#${c.slug}`}
                className="bg-surface p-6 no-underline transition-colors hover:bg-surface-2 sm:p-7"
              >
                <p className="m-0 mb-2.5">
                  <Badge tone="accent">{c.title}</Badge>
                </p>
                <p className="m-0 mb-3 text-[14.5px] leading-relaxed text-ink-2">{c.description}</p>
                <p className="m-0 font-mono text-[11.5px] text-ink-3">
                  {chapterCount} บท · {topicCount} หัวข้อในแผน
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- 8. สัญญาของเว็บนี้ ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="m-0 mb-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.13em] text-ink-3 uppercase before:h-px before:w-8 before:bg-line-strong before:content-['']">
            สัญญาของเว็บนี้
          </p>
          <h2 className="m-0 mb-9 font-display text-[clamp(26px,4vw,38px)] leading-[1.16] font-medium tracking-[-0.015em] text-ink">
            สี่ข้อที่จะไม่เปลี่ยน
          </h2>
          <ul className="m-0 grid list-none gap-px border border-line bg-line p-0 sm:grid-cols-2">
            {PROMISES.map((p) => (
              <li key={p.title} className="bg-surface p-6 sm:p-7">
                <h3 className="m-0 mb-2 font-display text-[16.5px] font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">{p.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- 9. เข้าใช้งาน ---------- */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="on-hero rounded-xl bg-hero-bg px-6 py-12 text-hero-ink sm:px-10 sm:py-16">
          <h2 className="m-0 mb-4 max-w-[18ch] font-display text-[clamp(28px,4.6vw,44px)] leading-[1.14] font-medium tracking-[-0.015em] text-hero-ink text-balance">
            เริ่มจากบทเดียวก็พอ
          </h2>
          <p className="m-0 mb-8 max-w-[54ch] text-[clamp(15px,2.2vw,17px)] leading-relaxed text-hero-ink-2">
            ลองเรียน “ฟังก์ชันกำลังสอง” ให้จบสักบท แล้วดูว่าการเข้าใจที่มาของสูตร
            ให้ความรู้สึกต่างจากการท่องจำแค่ไหน — ถ้าไม่ชอบก็ปิดไปได้เลย ไม่มีอะไรผูกมัด
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lesson/quadratic-function"
              className="inline-flex items-center justify-center rounded-lg bg-hero-cta px-8 py-4 text-center text-[16.5px] font-semibold text-hero-cta-ink no-underline transition-opacity hover:opacity-90 sm:py-3.5"
            >
              เปิดบทเรียนแรก
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-lg border border-hero-line px-8 py-4 text-center text-[16.5px] font-medium text-hero-ink no-underline transition-colors hover:border-hero-ink-3 sm:py-3.5"
            >
              ดูหลักสูตรทั้งหมด
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
