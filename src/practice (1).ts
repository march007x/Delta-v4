"use client";

import { useCallback, useEffect, useState } from "react";

export interface PracticeResult {
  /** จำนวนข้อที่ตอบถูกในรอบล่าสุด */
  correct: number;
  total: number;
  at: number;
  /** id ของข้อที่ตอบผิดในรอบล่าสุด — ใช้ให้ผู้เรียนกลับมาดูเฉพาะข้อที่พลาด */
  missed: string[];
}

export type PracticeMap = Record<string, PracticeResult>;

const KEY = "delta-practice-v1";

/**
 * ผลการฝึกเก็บในเบราว์เซอร์ผู้เรียนเอง ยังไม่มีระบบบัญชี
 * เก็บเฉพาะรอบล่าสุดต่อบท ไม่เก็บประวัติทุกครั้ง — ข้อมูลที่ไม่ได้ใช้ไม่ควรเก็บ
 */
function read(): PracticeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PracticeMap) : {};
  } catch {
    return {};
  }
}

function write(map: PracticeMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // เบราว์เซอร์ที่ปิดการเก็บข้อมูลยังใช้งานได้ แค่ไม่บันทึกผล
  }
}

export function usePracticeResults() {
  const [map, setMap] = useState<PracticeMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMap(read());
    setReady(true);
  }, []);

  const save = useCallback((slug: string, result: Omit<PracticeResult, "at">) => {
    setMap((prev) => {
      const next = { ...prev, [slug]: { ...result, at: Date.now() } };
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

/** เกณฑ์เดียวที่ใช้ทั้งเว็บ — ต่ำกว่า 70% ถือว่าควรกลับไปทบทวนบทนั้น */
export function needsReview(r: PracticeResult): boolean {
  return r.total > 0 && r.correct / r.total < 0.7;
}
