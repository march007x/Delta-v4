import { chapters, courses, lessons, topics } from "@/content";
import type { Block, Course, Lesson } from "@/content/schema";

export interface FormulaEntry {
  lesson: Lesson;
  chapterTitle: string;
  /** เฉพาะบล็อกที่เป็น "ของที่ต้องจำ" — กฎ ตาราง และสูตรกลาง */
  blocks: Block[];
}

export interface FormulaGroup {
  course: Course;
  entries: FormulaEntry[];
}

/** บล็อกที่ควรอยู่ในหน้าสรุปสูตร — ไม่รวมย่อหน้า ควิซ กราฟ หรือตัวอย่าง */
function isFormulaBlock(b: Block): boolean {
  if (b.kind === "table") return true;
  if (b.kind === "math") return true;
  if (b.kind === "callout") return b.tone === "rule";
  return false;
}

/**
 * ดึง "ภาคผนวกสูตร" ออกจากเนื้อหาบทเรียนโดยตรง
 *
 * ตั้งใจให้เป็น derived view ไม่ใช่ข้อมูลชุดที่สอง — แก้สูตรในบทเรียนที่เดียว
 * หน้าสรุปจะเปลี่ยนตามทันที ไม่มีทางที่สองที่หลุดจากกันได้
 */
export function getFormulaGroups(): FormulaGroup[] {
  const chapterOf = new Map(chapters.map((c) => [c.id, c]));
  const topicOf = new Map(topics.map((t) => [t.id, t]));

  return [...courses]
    .sort((a, b) => a.order - b.order)
    .map((course) => {
      const entries: FormulaEntry[] = [];
      for (const lesson of lessons) {
        if (lesson.status !== "published") continue;
        const topic = topicOf.get(lesson.topicId);
        const chapter = topic ? chapterOf.get(topic.chapterId) : undefined;
        if (!chapter || chapter.courseId !== course.id) continue;

        const blocks = lesson.sections.flatMap((s) => s.blocks).filter(isFormulaBlock);
        if (blocks.length === 0) continue;
        entries.push({ lesson, chapterTitle: chapter.title, blocks });
      }
      return { course, entries };
    })
    .filter((g) => g.entries.length > 0);
}

export function countFormulas(groups: FormulaGroup[]): number {
  return groups.reduce((n, g) => n + g.entries.reduce((m, e) => m + e.blocks.length, 0), 0);
}
