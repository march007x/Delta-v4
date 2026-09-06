import { chapters, courses, topics } from "@/content";
import { renderRich } from "@/lib/math/render";
import { SECTION_LABEL, type Lesson } from "@/content/schema";
import { shuffleWithSeed } from "@/lib/quiz";
import { getPublishedLessons } from "./content";

export interface PracticeChoice {
  html: string;
  correct: boolean;
}

interface QuestionBase {
  id: string;
  /** ขั้นที่โจทย์ข้อนี้มาจาก — บอกระดับความยากคร่าว ๆ ให้ผู้เรียนรู้ตัว */
  origin: string;
  promptHtml: string;
  explainHtml: string;
  /** แนวทางไล่ระดับ เปิดทีละขั้นเมื่อผู้เรียนกดขอ */
  hintsHtml: string[];
}

export interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  choices: PracticeChoice[];
}

export interface NumericQuestion extends QuestionBase {
  kind: "numeric";
  answer: number;
  tolerance?: number;
  exactHtml?: string;
  unit?: string;
}

export type PracticeQuestion = ChoiceQuestion | NumericQuestion;

export interface PracticeSet {
  slug: string;
  title: string;
  questions: PracticeQuestion[];
}

/** ขั้นที่ถือเป็น "โจทย์ฝึก" จริง ๆ — ขั้นอื่นที่มีควิซใช้เพื่อทำความเข้าใจระหว่างอ่าน */
const PRACTICE_SECTIONS = new Set(["guided", "practice", "challenge"]);

/** นับเฉพาะบล็อกที่เป็นโจทย์ ไม่ว่าจะปรนัยหรือกรอกตัวเลข */
export function isQuestionBlock(kind: string): boolean {
  return kind === "quiz" || kind === "numeric";
}

/**
 * ดึงชุดโจทย์ของบทหนึ่งออกมาเป็น HTML ที่เรนเดอร์เสร็จแล้ว
 *
 * เรนเดอร์ตอน build ทั้งหมด เพราะ KaTeX หนักเกินกว่าจะส่งไปทำงานในเบราว์เซอร์
 * และทำให้หน้าโหลดครั้งแรกไม่ต้องรอ JavaScript ก่อนจึงจะเห็นโจทย์
 */
export function getPracticeSet(lesson: Lesson): PracticeSet {
  const questions: PracticeQuestion[] = [];

  for (const section of lesson.sections) {
    if (!PRACTICE_SECTIONS.has(section.type)) continue;
    section.blocks.forEach((b, i) => {
      const id = `${lesson.slug}:${section.id}:${i}`;
      const origin = SECTION_LABEL[section.type];

      if (b.kind === "quiz") {
        questions.push({
          kind: "choice",
          id,
          origin,
          promptHtml: renderRich(b.prompt),
          choices: shuffleWithSeed(b.choices, id).map((c) => ({
            html: renderRich(c.text),
            correct: Boolean(c.correct),
          })),
          explainHtml: renderRich(b.explain),
          hintsHtml: (b.hints ?? (b.hint ? [b.hint] : [])).map(renderRich),
        });
      }

      if (b.kind === "numeric") {
        questions.push({
          kind: "numeric",
          id,
          origin,
          promptHtml: renderRich(b.prompt),
          answer: b.answer,
          ...(b.tolerance !== undefined ? { tolerance: b.tolerance } : {}),
          ...(b.exact ? { exactHtml: renderRich(b.exact) } : {}),
          ...(b.unit ? { unit: b.unit } : {}),
          explainHtml: renderRich(b.explain),
          hintsHtml: b.hints.map(renderRich),
        });
      }
    });
  }

  return { slug: lesson.slug, title: lesson.title, questions };
}

export interface PracticeSummary {
  slug: string;
  title: string;
  course: string;
  chapter: string;
  count: number;
  /** จำนวนข้อที่ต้องกรอกคำตอบเอง — บอกผู้เรียนว่าชุดนี้เดาไม่ได้แค่ไหน */
  numericCount: number;
}

/** รายการชุดฝึกทั้งหมดสำหรับหน้ารวม — ไม่มีเนื้อโจทย์ จึงเบามาก */
export function getPracticeIndex(): PracticeSummary[] {
  const chapterOf = new Map(chapters.map((c) => [c.id, c]));
  const courseOf = new Map(courses.map((c) => [c.id, c]));
  const topicOf = new Map(topics.map((t) => [t.id, t]));

  return getPublishedLessons()
    .map((lesson) => {
      const topic = topicOf.get(lesson.topicId);
      const chapter = topic ? chapterOf.get(topic.chapterId) : undefined;
      const course = chapter ? courseOf.get(chapter.courseId) : undefined;
      const blocks = lesson.sections
        .filter((s) => PRACTICE_SECTIONS.has(s.type))
        .flatMap((s) => s.blocks);
      return {
        slug: lesson.slug,
        title: lesson.title,
        course: course?.title ?? "",
        chapter: chapter?.title ?? "",
        count: blocks.filter((b) => isQuestionBlock(b.kind)).length,
        numericCount: blocks.filter((b) => b.kind === "numeric").length,
      };
    })
    .filter((s) => s.count > 0);
}
