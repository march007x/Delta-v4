import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAdjacentLessons,
  getLessonBySlug,
  getPublishedLessons,
  getPrerequisiteChain,
  getTopicById,
} from "@/lib/repo/content";
import { LessonView } from "@/components/lesson/LessonView";

export function generateStaticParams() {
  return getPublishedLessons().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return { title: "ไม่พบบทเรียน" };
  return { title: lesson.title, description: lesson.summary };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const topic = getTopicById(lesson.topicId);
  const prerequisites = getPrerequisiteChain(lesson.topicId, 1);
  const { prev, next } = getAdjacentLessons(lesson.slug);

  return (
    <LessonView lesson={lesson} topic={topic} prerequisites={prerequisites} prev={prev} next={next} />
  );
}
