import { chapters, courses, lessons, topics } from "@/content";
import { renderRich } from "@/lib/math/render";
import { shuffleWithSeed } from "@/lib/quiz";
import type { Lesson } from "@/content/schema";

interface ExamQuestionBase {
  id: string;
  chapter: string;
  lessonSlug: string;
  lessonTitle: string;
  promptHtml: string;
  explainHtml: string;
}

export interface ExamChoiceQuestion extends ExamQuestionBase {
  kind: "choice";
  choices: Array<{ html: string; correct: boolean }>;
}

export interface ExamNumericQuestion extends ExamQuestionBase {
  kind: "numeric";
  answer: number;
  tolerance?: number;
  exactHtml?: string;
  unit?: string;
}

export type ExamQuestion = ExamChoiceQuestion | ExamNumericQuestion;

export interface ExamSetMeta {
  id: string;
  title: string;
  courseTitle: string;
  courseSlug: string;
  round: number;
  count: number;
  minutes: number;
}

export interface ExamSet extends ExamSetMeta {
  questions: ExamQuestion[];
}

/** จำนวนชุดจำลองต่อระดับชั้น — ชุดต่างกันสุ่มจากคลังเดียวกันด้วย seed คนละตัว */
const ROUNDS = 3;
const TARGET = 30;
/** เวลาต่อข้อ (วินาที) — อิงจังหวะข้อสอบปรนัยทั่วไปที่ราว 1.5 นาทีต่อข้อ */
const SECONDS_PER_QUESTION = 90;

const EXAM_SECTIONS = new Set(["guided", "practice", "challenge"]);

interface Pooled {
  chapterId: string;
  chapter: string;
  lesson: Lesson;
  sectionId: string;
  blockIndex: number;
}

function poolFor(courseId: string): Pooled[] {
  const chapterOf = new Map(chapters.map((c) => [c.id, c]));
  const topicOf = new Map(topics.map((t) => [t.id, t]));
  const out: Pooled[] = [];

  for (const lesson of lessons) {
    if (lesson.status !== "published") continue;
    const topic = topicOf.get(lesson.topicId);
    const chapter = topic ? chapterOf.get(topic.chapterId) : undefined;
    if (!chapter || chapter.courseId !== courseId) continue;

    for (const section of lesson.sections) {
      if (!EXAM_SECTIONS.has(section.type)) continue;
      section.blocks.forEach((b, i) => {
        if (b.kind !== "quiz" && b.kind !== "numeric") return;
        out.push({
          chapterId: chapter.id,
          chapter: chapter.title,
          lesson,
          sectionId: section.id,
          blockIndex: i,
        });
      });
    }
  }
  return out;
}

/**
 * สุ่มแบบกระจายทุกบท (stratified) แทนการสุ่มล้วน
 *
 * สุ่มล้วนกับคลังที่บทหนึ่งมีโจทย์เยอะกว่าบทอื่น จะได้ข้อสอบที่เอียงไปทางบทนั้น
 * การหยิบวนทีละบทรับประกันว่าทุกบทได้ออกอย่างน้อยหนึ่งข้อก่อนที่บทใดจะได้ข้อที่สอง
 */
function stratifiedPick(pool: Pooled[], seed: string, target: number): Pooled[] {
  const byChapter = new Map<string, Pooled[]>();
  for (const p of pool) {
    const list = byChapter.get(p.chapterId) ?? [];
    list.push(p);
    byChapter.set(p.chapterId, list);
  }

  const buckets = [...byChapter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, list]) => shuffleWithSeed(list, `${seed}:${id}`));

  const picked: Pooled[] = [];
  let round = 0;
  while (picked.length < target) {
    let addedThisRound = 0;
    for (const bucket of buckets) {
      const item = bucket[round];
      if (!item) continue;
      picked.push(item);
      addedThisRound++;
      if (picked.length >= target) break;
    }
    if (addedThisRound === 0) break;
    round++;
  }

  return shuffleWithSeed(picked, `${seed}:order`);
}

function metaFor(courseSlug: string, courseTitle: string, round: number, count: number): ExamSetMeta {
  return {
    id: `${courseSlug}-${round}`,
    title: `ข้อสอบจำลอง ${courseTitle} ชุดที่ ${round}`,
    courseTitle,
    courseSlug,
    round,
    count,
    minutes: Math.round((count * SECONDS_PER_QUESTION) / 60),
  };
}

export function getExamSets(): ExamSetMeta[] {
  const out: ExamSetMeta[] = [];
  for (const course of [...courses].sort((a, b) => a.order - b.order)) {
    const pool = poolFor(course.id);
    if (pool.length < 10) continue;
    const count = Math.min(TARGET, pool.length);
    for (let r = 1; r <= ROUNDS; r++) {
      out.push(metaFor(course.slug, course.title, r, count));
    }
  }
  return out;
}

export function getExamSet(id: string): ExamSet | undefined {
  const match = /^(.+)-(\d+)$/.exec(id);
  if (!match) return undefined;
  const courseSlug = match[1]!;
  const round = Number(match[2]);
  const course = courses.find((c) => c.slug === courseSlug);
  if (!course || round < 1 || round > ROUNDS) return undefined;

  const pool = poolFor(course.id);
  if (pool.length < 10) return undefined;
  const count = Math.min(TARGET, pool.length);
  const picked = stratifiedPick(pool, `exam:${id}`, count);

  const questions: ExamQuestion[] = picked.map((p) => {
    const section = p.lesson.sections.find((s) => s.id === p.sectionId)!;
    const block = section.blocks[p.blockIndex]!;
    const qid = `${p.lesson.slug}:${p.sectionId}:${p.blockIndex}`;
    const base = {
      id: qid,
      chapter: p.chapter,
      lessonSlug: p.lesson.slug,
      lessonTitle: p.lesson.title,
      explainHtml: "",
    };

    if (block.kind === "quiz") {
      return {
        ...base,
        kind: "choice" as const,
        promptHtml: renderRich(block.prompt),
        choices: shuffleWithSeed(block.choices, `${qid}:${id}`).map((c) => ({
          html: renderRich(c.text),
          correct: Boolean(c.correct),
        })),
        explainHtml: renderRich(block.explain),
      };
    }
    if (block.kind === "numeric") {
      return {
        ...base,
        kind: "numeric" as const,
        promptHtml: renderRich(block.prompt),
        answer: block.answer,
        ...(block.tolerance !== undefined ? { tolerance: block.tolerance } : {}),
        ...(block.exact ? { exactHtml: renderRich(block.exact) } : {}),
        ...(block.unit ? { unit: block.unit } : {}),
        explainHtml: renderRich(block.explain),
      };
    }
    throw new Error("exam pool มีบล็อกที่ไม่ใช่โจทย์");
  });

  return { ...metaFor(course.slug, course.title, round, count), questions };
}
