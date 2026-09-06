import { chapters, courses, lessons, topics } from "@/content";
import { SECTION_LABEL } from "@/content/schema";

export interface SearchDoc {
  /** slug ของบทเรียน */
  slug: string;
  title: string;
  course: string;
  chapter: string;
  summary: string;
  /** หัวข้อย่อยที่ค้นเจอได้ — ชื่อกฎ ชื่อตาราง และชื่อขั้น */
  keys: string[];
  minutes: number;
}

/** ตัดสูตร LaTeX และตัวหนาออก เหลือเฉพาะคำที่คนพิมพ์ค้นหาจริง */
function plain(text: string): string {
  return text
    .replace(/\$[^$]*\$/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ดัชนีค้นหาที่สร้างตอน build
 *
 * ตั้งใจให้เล็กพอส่งไปทั้งก้อนกับหน้าเว็บ (ไม่กี่สิบกิโลไบต์)
 * จึงค้นได้ทันทีโดยไม่ต้องมีเซิร์ฟเวอร์ค้นหา ซึ่งตรงกับข้อจำกัด "ไม่มีงบ" ของโปรเจกต์
 */
export function buildSearchIndex(): SearchDoc[] {
  const chapterOf = new Map(chapters.map((c) => [c.id, c]));
  const courseOf = new Map(courses.map((c) => [c.id, c]));
  const topicOf = new Map(topics.map((t) => [t.id, t]));

  return lessons
    .filter((l) => l.status === "published")
    .map((lesson) => {
      const topic = topicOf.get(lesson.topicId);
      const chapter = topic ? chapterOf.get(topic.chapterId) : undefined;
      const course = chapter ? courseOf.get(chapter.courseId) : undefined;

      const keys = new Set<string>();
      for (const section of lesson.sections) {
        keys.add(SECTION_LABEL[section.type]);
        if (section.title) keys.add(plain(section.title));
        for (const b of section.blocks) {
          if (b.kind === "callout" && b.title) keys.add(plain(b.title));
          if (b.kind === "table" && b.caption) keys.add(plain(b.caption));
        }
      }

      return {
        slug: lesson.slug,
        title: lesson.title,
        course: course?.title ?? "",
        chapter: chapter?.title ?? "",
        summary: lesson.summary,
        keys: [...keys].filter((k) => k.length > 0).slice(0, 40),
        minutes: lesson.estimatedMinutes,
      };
    });
}
