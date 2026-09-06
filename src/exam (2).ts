"use client";

import { useCallback, useEffect, useState } from "react";

export interface ExamResult {
  correct: number;
  total: number;
  spentSeconds: number;
  /** บทที่ทำได้ต่ำกว่า 70% ในรอบนั้น — ใช้ชี้ว่าควรกลับไปทบทวนอะไรก่อน */
  weakChapters: string[];
  at: number;
}

export type ExamMap = Record<string, ExamResult>;

const KEY = "delta-exam-v1";

function read(): ExamMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamMap) : {};
  } catch {
    return {};
  }
}

function write(map: ExamMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // เบราว์เซอร์ที่ปิดการเก็บข้อมูลยังทำข้อสอบได้ แค่ไม่บันทึกผล
  }
}

export function useExamResults() {
  const [map, setMap] = useState<ExamMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMap(read());
    setReady(true);
  }, []);

  const save = useCallback((id: string, result: Omit<ExamResult, "at">) => {
    setMap((prev) => {
      const next = { ...prev, [id]: { ...result, at: Date.now() } };
      write(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setMap({});
    write({});
  }, []);

  return { map, ready, save, reset };
}
