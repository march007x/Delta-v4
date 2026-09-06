"use client";

import { useCallback, useEffect, useState } from "react";

export interface LessonProgress {
  status: "not_started" | "in_progress" | "completed";
  lastOpenedAt: number;
  completedAt?: number;
}

export type ProgressMap = Record<string, LessonProgress>;

const KEY = "delta-progress-v1";

/**
 * ที่เก็บความก้าวหน้า — ตอนนี้อยู่ในเบราว์เซอร์ของผู้เรียนเอง ยังไม่มีระบบบัญชี
 * อินเทอร์เฟซถูกออกแบบให้เหมือนกับที่จะเรียกฐานข้อมูลในอนาคต
 * เมื่อเพิ่มระบบล็อกอินแล้ว เปลี่ยนเฉพาะข้างในฟังก์ชันเหล่านี้
 */
function read(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // เบราว์เซอร์บางตัวปิดการเก็บข้อมูลไว้ — ให้ใช้งานต่อได้โดยไม่บันทึก
  }
}

export function useProgress() {
  const [map, setMap] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMap(read());
    setReady(true);
  }, []);

  const update = useCallback((lessonId: string, patch: Partial<LessonProgress>) => {
    setMap((prev) => {
      const current: LessonProgress = prev[lessonId] ?? {
        status: "not_started",
        lastOpenedAt: Date.now(),
      };
      const next = { ...prev, [lessonId]: { ...current, ...patch } };
      write(next);
      return next;
    });
  }, []);

  const markOpened = useCallback(
    (lessonId: string) => {
      setMap((prev) => {
        const current = prev[lessonId];
        if (current?.status === "completed") return prev;
        const next: ProgressMap = {
          ...prev,
          [lessonId]: { status: "in_progress", lastOpenedAt: Date.now() },
        };
        write(next);
        return next;
      });
    },
    [],
  );

  const toggleCompleted = useCallback(
    (lessonId: string) => {
      const current = map[lessonId];
      const done = current?.status === "completed";
      update(lessonId, {
        status: done ? "in_progress" : "completed",
        completedAt: done ? undefined : Date.now(),
        lastOpenedAt: Date.now(),
      });
    },
    [map, update],
  );

  const reset = useCallback(() => {
    setMap({});
    write({});
  }, []);

  return { map, ready, markOpened, toggleCompleted, reset };
}
