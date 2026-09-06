"use client";

import { useEffect, useState } from "react";

export interface VizTheme {
  bg: string;
  grid: string;
  gridMajor: string;
  axis: string;
  curve: string;
  delta: string;
  point: string;
  label: string;
  fill: string;
}

const VARS: Record<keyof VizTheme, string> = {
  bg: "--viz-bg",
  grid: "--viz-grid",
  gridMajor: "--viz-grid-major",
  axis: "--viz-axis",
  curve: "--viz-curve",
  delta: "--viz-delta",
  point: "--viz-point",
  label: "--viz-label",
  fill: "--viz-fill",
};

const FALLBACK: VizTheme = {
  bg: "#ffffff",
  grid: "#e6e9f4",
  gridMajor: "#ced4e8",
  axis: "#6b7290",
  curve: "#2e45c4",
  delta: "#b8620a",
  point: "#141728",
  label: "#545a76",
  fill: "rgba(46,69,196,0.1)",
};

function readTheme(): VizTheme {
  if (typeof window === "undefined") return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const out = {} as VizTheme;
  (Object.keys(VARS) as Array<keyof VizTheme>).forEach((k) => {
    const v = cs.getPropertyValue(VARS[k]).trim();
    out[k] = v || FALLBACK[k];
  });
  return out;
}

/**
 * อ่านสีของธีมจาก CSS variable "ครั้งเดียวต่อการเปลี่ยนธีม" ไม่ใช่ทุกเฟรม
 * (getComputedStyle ทุกเฟรมจะกินเวลาจนหลุดเป้า 55 FPS บนมือถือ)
 */
export function useVizTheme(): VizTheme {
  const [theme, setTheme] = useState<VizTheme>(FALLBACK);

  useEffect(() => {
    const update = () => setTheme(readTheme());
    update();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    window.addEventListener("delta:themechange", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("delta:themechange", update);
      mo.disconnect();
    };
  }, []);

  return theme;
}
