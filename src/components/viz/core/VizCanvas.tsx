"use client";

import { useCallback, useEffect, useRef } from "react";
import { Viewport, type Bounds } from "./viewport";
import { useVizTheme, type VizTheme } from "./theme";

export type DrawFn = (ctx: CanvasRenderingContext2D, vp: Viewport, theme: VizTheme) => void;

export interface PointerInfo {
  x: number;
  y: number;
  phase: "down" | "move" | "up";
}

interface Props {
  bounds: Bounds;
  /** ความสูงเป็น CSS pixel — ความกว้างยืดตามคอนเทนเนอร์ */
  height?: number;
  /** บังคับให้สเกลแกน x และ y เท่ากัน (วงกลม เวกเตอร์ ระนาบเชิงซ้อน) */
  square?: boolean;
  draw: DrawFn;
  onPointer?: (info: PointerInfo, vp: Viewport) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * โฮสต์ของ canvas ทุกตัวในระบบ
 * - วาดผ่าน requestAnimationFrame ไม่ผ่าน state ของ React (ลากได้ลื่นถึง 60 FPS)
 * - รองรับ devicePixelRatio ให้เส้นคม
 * - Pointer Events ตัวเดียวครอบคลุมทั้งเมาส์ ปากกา และนิ้ว
 */
export function VizCanvas({
  bounds,
  height = 320,
  square = false,
  draw,
  onPointer,
  ariaLabel,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vpRef = useRef<Viewport | null>(null);
  const frameRef = useRef<number | null>(null);
  const drawRef = useRef(draw);
  const theme = useVizTheme();
  const themeRef = useRef(theme);

  drawRef.current = draw;
  themeRef.current = theme;

  const render = useCallback(() => {
    frameRef.current = null;
    const canvas = canvasRef.current;
    const vp = vpRef.current;
    if (!canvas || !vp) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRef.current(ctx, vp, themeRef.current);
  }, []);

  const schedule = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(render);
  }, [render]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const width = Math.max(240, parent ? parent.clientWidth : 320);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    vpRef.current = square
      ? Viewport.square(width, height, bounds)
      : new Viewport(width, height, bounds);
    schedule();
  }, [bounds, height, square, schedule]);

  useEffect(() => {
    resize();
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [resize]);

  // วาดใหม่ทุกครั้งที่พารามิเตอร์หรือธีมเปลี่ยน
  useEffect(() => {
    schedule();
  });

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const dragging = useRef(false);

  function toMath(e: React.PointerEvent<HTMLCanvasElement>) {
    const vp = vpRef.current;
    const canvas = canvasRef.current;
    if (!vp || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: vp.mathX(e.clientX - rect.left), y: vp.mathY(e.clientY - rect.top) };
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ touchAction: onPointer ? "none" : "auto", display: "block", borderRadius: 8 }}
      onPointerDown={(e) => {
        if (!onPointer) return;
        const p = toMath(e);
        if (!p || !vpRef.current) return;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointer({ ...p, phase: "down" }, vpRef.current);
      }}
      onPointerMove={(e) => {
        if (!onPointer || !dragging.current) return;
        const p = toMath(e);
        if (!p || !vpRef.current) return;
        onPointer({ ...p, phase: "move" }, vpRef.current);
      }}
      onPointerUp={(e) => {
        if (!onPointer || !dragging.current) return;
        dragging.current = false;
        const p = toMath(e);
        if (!p || !vpRef.current) return;
        onPointer({ ...p, phase: "up" }, vpRef.current);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    />
  );
}
