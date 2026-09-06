import { chapters, courses, lessons, topics } from "@/content";
import type { Chapter, Course, Lesson, Topic } from "@/content/schema";

/**
 * ชั้นเข้าถึงเนื้อหา — หน้าเว็บทุกหน้าเรียกผ่านฟังก์ชันในไฟล์นี้เท่านั้น
 * เมื่อย้ายเนื้อหาไป PostgreSQL/Supabase ในเฟสถัดไป
 * แก้เฉพาะไฟล์นี้ให้เป็น async query โดยไม่ต้องแตะหน้าเว็บเลย
 */

export function getCourses(): Course[] {
  return [...courses].sort((a, b) => a.order - b.order);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getChapters(courseId: string): Chapter[] {
  return chapters.filter((c) => c.courseId === courseId).sort((a, b) => a.order - b.order);
}

export function getTopics(chapterId: string): Topic[] {
  return topics.filter((t) => t.chapterId === chapterId).sort((a, b) => a.order - b.order);
}

export function getTopicById(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

export function getLessons(topicId: string): Lesson[] {
  return lessons.filter((l) => l.topicId === topicId).sort((a, b) => a.order - b.order);
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug && l.status === "published");
}

export function getPublishedLessons(): Lesson[] {
  return lessons.filter((l) => l.status === "published");
}

/** หัวข้อที่มีบทเรียนพร้อมเรียนแล้ว — ใช้บอกผู้ใช้ตรง ๆ ว่าอะไรเปิดแล้ว อะไรยังไม่เปิด */
export function isTopicReady(topicId: string): boolean {
  return lessons.some((l) => l.topicId === topicId && l.status === "published");
}

/** บทก่อนหน้าและบทถัดไปตามลำดับที่ควรเรียน */
export function getAdjacentLessons(slug: string): { prev?: Lesson; next?: Lesson } {
  const list = getPublishedLessons();
  const i = list.findIndex((l) => l.slug === slug);
  if (i === -1) return {};
  return { prev: list[i - 1], next: list[i + 1] };
}

/** ไล่หาพื้นฐานย้อนขึ้นไป — โครงที่จะใช้สาวรากจุดอ่อนใน Phase วิเคราะห์ */
export function getPrerequisiteChain(topicId: string, depth = 3): Topic[] {
  const out: Topic[] = [];
  const seen = new Set<string>([topicId]);
  let frontier = [topicId];

  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      const t = getTopicById(id);
      if (!t) continue;
      for (const p of t.prerequisites) {
        if (seen.has(p)) continue;
        seen.add(p);
        const parent = getTopicById(p);
        if (parent) {
          out.push(parent);
          next.push(p);
        }
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return out;
}
