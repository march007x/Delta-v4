"use client";

import { useCallback, useRef, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment, plot } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";
import { exact } from "@/lib/math/exact";

type Mode = "line" | "circle";

const BOUNDS = { xMin: -8, xMax: 8, yMin: -6, yMax: 6 };

/**
 * เรขาคณิตวิเคราะห์ — ลากจุด A และ B แล้วดูระยะทาง จุดกึ่งกลาง ความชัน
 * และสมการที่เปลี่ยนตามทันที
 *
 * โหมดวงกลมใช้ A เป็นจุดศูนย์กลางและ B เป็นจุดบนเส้นรอบวง
 * ทำให้เห็นว่า "รัศมีคือระยะทาง" ซึ่งเป็นที่มาของสมการวงกลมทั้งสมการ
 */
export function InteractiveAnalyticGeometry({ height = 360 }: { height?: number }) {
  const [mode, setMode] = useState<Mode>("line");
  const [a, setA] = useState<[number, number]>([-3, -1]);
  const [b, setB] = useState<[number, number]>([3, 3]);
  const dragging = useRef<"a" | "b" | null>(null);

  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dist = Math.hypot(dx, dy);
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const slope = dx === 0 ? null : dy / dx;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      if (mode === "circle") {
        const r = dist;
        ctx.save();
        ctx.strokeStyle = theme.curve;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(vp.px(a[0]), vp.py(a[1]), r * vp.scaleX, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = theme.fill;
        ctx.fill();
        ctx.restore();
        drawSegment(ctx, vp, a, b, { color: theme.delta, width: 2, dash: [5, 4] });
        drawLabel(ctx, vp, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, `r = ${fmt(r)}`, {
          color: theme.delta,
          bg: theme.bg,
          dx: 8,
        });
      } else {
        // เส้นตรงผ่าน A และ B ลากยาวเต็มกรอบ
        if (dx === 0) {
          drawSegment(ctx, vp, [a[0], vp.bounds.yMin], [a[0], vp.bounds.yMax], {
            color: theme.curve,
            width: 2.5,
          });
        } else {
          const m = dy / dx;
          plot(ctx, vp, (x) => m * (x - a[0]) + a[1], { color: theme.curve, width: 2.5 });
        }

        // สามเหลี่ยมความชัน — ทำให้เห็นว่า m คือ Δy ต่อ Δx
        drawSegment(ctx, vp, a, [b[0], a[1]], { color: theme.label, width: 1.5, dash: [4, 4] });
        drawSegment(ctx, vp, [b[0], a[1]], b, { color: theme.label, width: 1.5, dash: [4, 4] });
        drawLabel(ctx, vp, (a[0] + b[0]) / 2, a[1], `Δx = ${fmt(dx)}`, {
          color: theme.label,
          bg: theme.bg,
          dx: -26,
          dy: 15,
        });
        drawLabel(ctx, vp, b[0], (a[1] + b[1]) / 2, `Δy = ${fmt(dy)}`, {
          color: theme.label,
          bg: theme.bg,
          dx: 8,
        });
        drawPoint(ctx, vp, mid[0], mid[1], { color: theme.bg, radius: 5, ring: theme.delta });
        drawLabel(ctx, vp, mid[0], mid[1], "จุดกึ่งกลาง", {
          color: theme.delta,
          bg: theme.bg,
          dy: 16,
          dx: -22,
        });
      }

      drawPoint(ctx, vp, a[0], a[1], { color: theme.point, radius: 7, ring: theme.bg });
      drawPoint(ctx, vp, b[0], b[1], { color: theme.curve, radius: 7, ring: theme.bg });
      drawLabel(ctx, vp, a[0], a[1], `A(${fmt(a[0])}, ${fmt(a[1])})`, {
        color: theme.point,
        bg: theme.bg,
        dy: -16,
      });
      drawLabel(ctx, vp, b[0], b[1], `B(${fmt(b[0])}, ${fmt(b[1])})`, {
        color: theme.curve,
        bg: theme.bg,
        dy: -16,
      });
    },
    [a, b, dx, dy, dist, mid, mode],
  );

  const handlePointer = useCallback(
    (info: { x: number; y: number; phase: "down" | "move" | "up" }) => {
      const snap = (v: number) => Math.max(-7.5, Math.min(7.5, Math.round(v * 2) / 2));
      const p: [number, number] = [snap(info.x), snap(info.y)];

      if (info.phase === "down") {
        const da = Math.hypot(info.x - a[0], info.y - a[1]);
        const db = Math.hypot(info.x - b[0], info.y - b[1]);
        dragging.current = da <= db ? "a" : "b";
      }
      if (dragging.current === "a") setA(p);
      else if (dragging.current === "b") setB(p);
      if (info.phase === "up") dragging.current = null;
    },
    [a, b],
  );

  // สมการเส้นตรงในรูป y = mx + c หรือ x = k เมื่อเป็นเส้นตั้ง
  const lineEq = (() => {
    if (dx === 0) return `x = ${fmtExact(a[0])}`;
    const m = dy / dx;
    const c = a[1] - m * a[0];
    const mS = exact(m) ?? fmt(m);
    const cS = exact(Math.abs(c)) ?? fmt(Math.abs(c));
    // ใส่วงเล็บเมื่อความชันเป็นเศษส่วน มิฉะนั้น "y = 2/3x" จะอ่านผิดเป็น 2/(3x)
    const mPart =
      m === 1 ? "x" : m === -1 ? "-x" : mS.includes("/") ? `(${mS})x` : `${mS}x`;
    if (Math.abs(c) < 1e-9) return `y = ${mPart}`;
    return `y = ${mPart} ${c < 0 ? "−" : "+"} ${cS}`;
  })();

  const circleEq = (() => {
    const h = a[0];
    const k = a[1];
    const xPart = h === 0 ? "x²" : `(x ${h < 0 ? "+" : "−"} ${fmt(Math.abs(h))})²`;
    const yPart = k === 0 ? "y²" : `(y ${k < 0 ? "+" : "−"} ${fmt(Math.abs(k))})²`;
    return `${xPart} + ${yPart} = ${fmt(dist * dist)}`;
  })();

  return (
    <VizFrame
      title={mode === "line" ? "เส้นตรงผ่านสองจุด" : "วงกลมจากจุดศูนย์กลางและรัศมี"}
      caption={
        mode === "line"
          ? "ลากจุด A หรือ B แล้วดูว่าความชัน ระยะทาง และสมการเปลี่ยนตามอย่างไร"
          : "A คือจุดศูนย์กลาง B คือจุดบนเส้นรอบวง — รัศมีคือระยะระหว่างสองจุดพอดี"
      }
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`จุด A อยู่ที่ ${fmt(a[0])}, ${fmt(a[1])} และจุด B อยู่ที่ ${fmt(b[0])}, ${fmt(b[1])} ระยะห่าง ${fmt(dist)} ${
            slope === null ? "เส้นตั้งฉากกับแกน x" : `ความชัน ${fmt(slope)}`
          }`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              โหมด
            </p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ["line", "เส้นตรงผ่านสองจุด"],
                  ["circle", "วงกลม"],
                ] as Array<[Mode, string]>
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={mode === k}
                  onClick={() => setMode(k)}
                  className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                    mode === k
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setA([-3, -1]);
              setB([3, 3]);
            }}
            className="self-start rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
          >
            รีเซ็ตจุด
          </button>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            ลากจุดบนกราฟได้โดยตรง ค่าจะติดกริดทีละครึ่งหน่วย
          </p>
        </div>
      }
      readout={
        <Readout
          rows={
            mode === "line"
              ? [
                  { label: "ระยะ AB", value: fmtExact(dist, 3), tone: "delta" },
                  { label: "จุดกึ่งกลาง", value: `(${fmtExact(mid[0])}, ${fmtExact(mid[1])})` },
                  { label: "ความชัน m", value: slope === null ? "ไม่นิยาม" : fmtExact(slope) },
                  { label: "สมการเส้นตรง", value: lineEq },
                ]
              : [
                  { label: "จุดศูนย์กลาง", value: `(${fmtExact(a[0])}, ${fmtExact(a[1])})` },
                  { label: "รัศมี r", value: fmtExact(dist, 3), tone: "delta" },
                  { label: "r²", value: fmtExact(dist * dist) },
                  { label: "สมการวงกลม", value: circleEq },
                ]
          }
        />
      }
    />
  );
}
