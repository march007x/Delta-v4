import type { Metadata } from "next";
import { getChapters, getCourses, getLessons, getTopics, isTopicReady } from "@/lib/repo/content";
import { getPracticeIndex } from "@/lib/repo/practice";
import { LEVEL_LABEL } from "@/content/schema";
import { CourseGrid, type CourseCard } from "@/components/courses/CourseGrid";

export const metadata: Metadata = {
  title: "คอร์สเรียน",
  description: "บทเรียนทั้งหมดตั้งแต่ ม.4 ถึง ม.6 พร้อมสถานะว่าบทไหนเปิดให้เรียนแล้ว",
};

export default function CoursesPage() {
  const courses = getCourses();
  const questionsBySlug = new Map(getPracticeIndex().map((p) => [p.slug, p.count]));

  const cards: CourseCard[] = [];
  for (const course of courses) {
    for (const chapter of getChapters(course.id)) {
      for (const topic of getTopics(chapter.id)) {
        const lesson = getLessons(topic.id)[0];
        cards.push({
          slug: lesson?.slug ?? topic.slug,
          title: topic.title,
          summary: topic.summary,
          level: LEVEL_LABEL[course.level],
          courseId: course.id,
          lessonId: lesson?.id,
          ready: isTopicReady(topic.id),
          questionCount: lesson ? (questionsBySlug.get(lesson.slug) ?? 0) : 0,
        });
      }
    }
  }

  const levels = courses.map((c) => ({ id: c.id, label: LEVEL_LABEL[c.level] }));

  return (
    <>
      {/* แบนเนอร์ — ภาพเดียวกับหน้าแรก ใช้ซ้ำจึงไม่มีต้นทุนโหลดเพิ่มเมื่อผู้เรียนเดินทางเข้ามา
          สูงไม่เท่ากันตามจอ: มือถือเตี้ยเพื่อไม่ให้กินพื้นที่จนไม่เห็นรายการบท */}
      <section className="relative overflow-hidden border-b border-line">
        <img
          src="/hero-1600.webp"
          srcSet="/hero-900.webp 900w, /hero-1600.webp 1600w, /hero-2400.webp 2400w"
          sizes="100vw"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "50% 44%" }}
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(4,7,14,0.92) 0%, rgba(4,7,14,0.78) 36%, rgba(4,7,14,0.30) 100%)," +
              "linear-gradient(180deg, rgba(4,7,14,0.50) 0%, rgba(4,7,14,0.10) 45%, rgba(4,7,14,0.70) 100%)",
          }}
        />
        <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <p className="m-0 mb-3 font-mono text-[11px] tracking-[0.2em] text-white/55 uppercase">
            Courses
          </p>
          <h1 className="m-0 mb-4 max-w-[16ch] font-display text-[clamp(28px,5.2vw,46px)] leading-[1.15] font-semibold tracking-tight text-white text-balance">
            เลือกเส้นทางการเรียนรู้ที่ใช่สำหรับคุณ
          </h1>
          <p className="m-0 max-w-[52ch] text-[clamp(14.5px,2vw,16.5px)] leading-relaxed text-white/75">
            บทเรียนทั้งหมดออกแบบตามหลักสูตรไทย เริ่มจากคำถามว่าทำไมต้องมีเรื่องนี้
            แล้วค่อยพาไปเจอสูตร ปิดท้ายด้วยโจทย์ที่มีเฉลยบอกเหตุผล
          </p>
        </div>
      </section>

      <div className="px-4 py-8 sm:px-6 lg:px-10">
        <CourseGrid cards={cards} levels={levels} />
      </div>
    </>
  );
}
