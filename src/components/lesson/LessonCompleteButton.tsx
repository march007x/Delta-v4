"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress/store";

export function LessonCompleteButton({ lessonId }: { lessonId: string }) {
  const { map, ready, markOpened, toggleCompleted } = useProgress();
  const done = map[lessonId]?.status === "completed";

  useEffect(() => {
    markOpened(lessonId);
  }, [lessonId, markOpened]);

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => toggleCompleted(lessonId)}
      className={`rounded-lg px-4 py-2 text-[14.5px] font-medium ${
        done ? "border border-ok bg-ok-soft text-ok" : "bg-accent text-white hover:opacity-90"
      }`}
    >
      {done ? "เรียนจบแล้ว — กดเพื่อยกเลิก" : "ทำเครื่องหมายว่าเรียนจบ"}
    </button>
  );
}
