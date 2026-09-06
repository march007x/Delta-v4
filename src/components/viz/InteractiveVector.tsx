"use client";

import { useCallback, useRef, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawSegment } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

type Show = "sum" | "diff" | "proj";

const BOUNDS = { xMin: -7, xMax: 7, yMin: -5.5, yMax: 5.5 };

/** วาดลูกศรจากจุดกำเนิดหรือจากจุดที่กำหนด */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  from: [number, number],
  to: [number, number],
  color: string,
  width = 3,
  dash?: number[],
) {
  const x1 = vp.px(from[0]);
  const y1 = vp.py(from[1]);
  const x2 = vp.px(to[0]);
  const y2 = vp.py(to[1]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // หัวลูกศร
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - 0.4), y2 - head * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - head * Math.cos(ang + 0.4), y2 - head * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * เวกเตอร์บนระนาบ — ลากหัวลูกศรของ u และ v
 *
 * สิ่งที่ต้องการให้เห็น: การบวกเวกเตอร์คือการต่อหางกับหัว
 * และผลคูณจุดบอกว่าสองเวกเตอร์ "ไปทางเดียวกัน" มากแค่ไหน
 * โดยเป็นศูนย์พอดีเมื่อตั้งฉากกัน
 */
export function InteractiveVector({ height = 380 }: { height?: number }) {
  const [u, setU] = useState<[number, number]>([4, 1]);
  const [v, setV] = useState<[number, number]>([1, 3]);
  const [show, setShow] = useState<Show>("sum");
  const dragging = useRef<"u" | "v" | null>(null);

  const magU = Math.hypot(u[0], u[1]);
  const magV = Math.hypot(v[0], v[1]);
  const dot = u[0] * v[0] + u[1] * v[1];
  const cosT = magU && magV ? dot / (magU * magV) : 0;
  const angle = magU && magV ? (Math.acos(Math.max(-1, Math.min(1, cosT))) * 180) / Math.PI : 0;
  const sum: [number, number] = [u[0] + v[0], u[1] + v[1]];
  const diff: [number, number] = [u[0] - v[0], u[1] - v[1]];
  // ส่วนฉายของ u ลงบน v
  const projScalar = magV ? dot / magV : 0;
  const proj: [number, number] = magV
    ? [(dot / (magV * magV)) * v[0], (dot / (magV * magV)) * v[1]]
    : [0, 0];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      if (show === "sum") {
        // สี่เหลี่ยมด้านขนาน — เส้นประคือการเลื่อนเวกเตอร์ไปต่อหาง
        drawSegment(ctx, vp, u, sum, { color: theme.label, width: 1.5, dash: [4, 4] });
        drawSegment(ctx, vp, v, sum, { color: theme.label, width: 1.5, dash: [4, 4] });
        drawArrow(ctx, vp, [0, 0], sum, theme.delta, 3.5);
        drawLabel(ctx, vp, sum[0], sum[1], `u + v`, { color: theme.delta, bg: theme.bg, dy: -16 });
      } else if (show === "diff") {
        drawArrow(ctx, vp, [0, 0], diff, theme.delta, 3.5);
        // u − v คือลูกศรจากหัว v ไปหัว u
        drawSegment(ctx, vp, v, u, { color: theme.delta, width: 1.5, dash: [5, 4] });
        drawLabel(ctx, vp, diff[0], diff[1], `u − v`, { color: theme.delta, bg: theme.bg, dy: -16 });
      } else {
        drawArrow(ctx, vp, [0, 0], proj, theme.delta, 5);
        drawSegment(ctx, vp, u, proj, { color: theme.label, width: 1.5, dash: [4, 4] });
        drawLabel(ctx, vp, proj[0], proj[1], `ส่วนฉาย`, {
          color: theme.delta,
          bg: theme.bg,
          dy: 16,
        });
      }

      drawArrow(ctx, vp, [0, 0], u, theme.curve, 3.5);
      drawArrow(ctx, vp, [0, 0], v, theme.point, 3.5);
      drawLabel(ctx, vp, u[0], u[1], `u(${fmt(u[0])}, ${fmt(u[1])})`, {
        color: theme.curve,
        bg: theme.bg,
        dy: -16,
      });
      drawLabel(ctx, vp, v[0], v[1], `v(${fmt(v[0])}, ${fmt(v[1])})`, {
        color: theme.point,
        bg: theme.bg,
        dy: -16,
      });

      // เครื่องหมายมุมฉากเมื่อตั้งฉากกันพอดี
      if (Math.abs(dot) < 1e-9 && magU > 0 && magV > 0) {
        drawLabel(ctx, vp, 0, 0, "ตั้งฉาก (u · v = 0)", {
          color: theme.delta,
          bg: theme.bg,
          dx: 10,
          dy: 18,
        });
      }
    },
    [u, v, sum, diff, proj, show, dot, magU, magV],
  );

  const handlePointer = useCallback(
    (info: { x: number; y: number; phase: "down" | "move" | "up" }) => {
      const snap = (n: number) => Math.max(-6.5, Math.min(6.5, Math.round(n * 2) / 2));
      const p: [number, number] = [snap(info.x), snap(info.y)];
      if (info.phase === "down") {
        const du = Math.hypot(info.x - u[0], info.y - u[1]);
        const dv = Math.hypot(info.x - v[0], info.y - v[1]);
        dragging.current = du <= dv ? "u" : "v";
      }
      if (dragging.current === "u") setU(p);
      else if (dragging.current === "v") setV(p);
      if (info.phase === "up") dragging.current = null;
    },
    [u, v],
  );

  return (
    <VizFrame
      title="เวกเตอร์บนระนาบ"
      caption="ลากหัวลูกศรของ u หรือ v แล้วดูผลบวก ผลต่าง ผลคูณจุด และมุมระหว่างเวกเตอร์"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`เวกเตอร์ u เท่ากับ ${fmt(u[0])} ${fmt(u[1])} และ v เท่ากับ ${fmt(v[0])} ${fmt(v[1])} ผลคูณจุดเท่ากับ ${fmt(dot)} มุมระหว่างเวกเตอร์ ${fmt(angle, 1)} องศา`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              แสดงเพิ่ม
            </p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ["sum", "ผลบวก u + v"],
                  ["diff", "ผลต่าง u − v"],
                  ["proj", "ส่วนฉายของ u บน v"],
                ] as Array<[Show, string]>
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={show === k}
                  onClick={() => setShow(k)}
                  className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                    show === k
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
              setU([4, 1]);
              setV([1, 3]);
            }}
            className="self-start rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
          >
            รีเซ็ตเวกเตอร์
          </button>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            ลองลากให้ผลคูณจุดเป็น 0 แล้วดูว่าสองเวกเตอร์ทำมุมกันเท่าไร
          </p>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "|u|", value: fmtExact(magU, 3) },
            { label: "|v|", value: fmtExact(magV, 3) },
            { label: "u · v", value: fmtExact(dot), tone: "delta" },
            { label: "มุมระหว่าง", value: `${fmt(angle, 1)}°` },
            {
              label: show === "sum" ? "u + v" : show === "diff" ? "u − v" : "ขนาดส่วนฉาย",
              value:
                show === "sum"
                  ? `(${fmt(sum[0])}, ${fmt(sum[1])})`
                  : show === "diff"
                    ? `(${fmt(diff[0])}, ${fmt(diff[1])})`
                    : fmtExact(projScalar, 3),
            },
          ]}
        />
      }
    />
  );
}
