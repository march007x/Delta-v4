import { chapters, courses, lessons, topics } from "@/content";

export interface ProgressLesson {
  /** id ของบทเรียน — ตรงกับคีย์ที่ใช้ใน localStorage ของความก้าวหน้า */
  id: string;
  slug: string;
  title: string;
  topicId: string;
  chapter: string;
  course: string;
  courseSlug: string;
  minutes: number;
  /** id ของหัวข้อที่ต้องแม่นก่อน — ใช้แนะนำว่าควรเรียนอะไรต่อ */
  prerequisites: string[];
  quizCount: number;
}

const PRACTICE_SECTIONS = new Set(["guided", "practice", "challenge"]);

/**
 * ดัชนีบทเรียนแบบเบาสำหรับหน้าความก้าวหน้า
 *
 * ไม่มีเนื้อหาบทเรียนติดมาเลย มีแต่โครงสร้างกับ id
 * เพราะหน้านั้นต้องรวมข้อมูลจาก localStorage สามชุด จึงต้องเป็น client component
 */
export function buildProgressIndex(): ProgressLesson[] {
  const chapterOf = new Map(chapters.map((c) => [c.id, c]));
  const courseOf = new Map(courses.map((c) => [c.id, c]));
  const topicOf = new Map(topics.map((t) => [t.id, t]));

  return lessons
    .filter((l) => l.status === "published")
    .map((lesson) => {
      const topic = topicOf.get(lesson.topicId);
      const chapter = topic ? chapterOf.get(topic.chapterId) : undefined;
      const course = chapter ? courseOf.get(chapter.courseId) : undefined;
      return {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        topicId: lesson.topicId,
        chapter: chapter?.title ?? "",
        course: course?.title ?? "",
        courseSlug: course?.slug ?? "",
        minutes: lesson.estimatedMinutes,
        prerequisites: topic?.prerequisites ?? [],
        quizCount: lesson.sections
          .filter((s) => PRACTICE_SECTIONS.has(s.type))
          .reduce(
            (n, s) =>
              n + s.blocks.filter((b) => b.kind === "quiz" || b.kind === "numeric").length,
            0,
          ),
      };
    });
}
