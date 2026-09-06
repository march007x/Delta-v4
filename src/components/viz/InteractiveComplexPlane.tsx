"use client";

import { useCallback, useRef, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";
import { exactPi } from "@/lib/math/exact";

type Op = "none" | "conj" | "mulZ" | "square";

const BASE_SPAN = 5;

/**
 * ระนาบเชิงซ้อน — ลากจุด z แล้วดูโมดูลัส อาร์กิวเมนต์ และรูปเชิงขั้ว
 *
 * สิ่งที่ต้องการให้เห็นมากที่สุดคือ **การคูณจำนวนเชิงซ้อนคือการหมุนและขยาย**
 * ซึ่งมองไม่เห็นเลยถ้าดูแต่รูปพีชคณิต a + bi
 */
export function InteractiveComplexPlane({ height = 380 }: { height?: number }) {
  const [z, setZ] = useState<[number, number]>([3, 2]);
  const [w, setW] = useState<[number, number]>([1, 1]);
  const [op, setOp] = useState<Op>("none");
  const dragging = useRef<"z" | "w" | null>(null);

  const [a, b] = z;
  const r = Math.hypot(a, b);
  const thetaRad = Math.atan2(b, a);
  const thetaDeg = (thetaRad * 180) / Math.PI;

  const conj: [number, number] = [a, -b];
  const square: [number, number] = [a * a - b * b, 2 * a * b];
  const mul: [number, number] = [a * w[0] - b * w[1], a * w[1] + b * w[0]];

  const result: [number, number] =
    op === "conj" ? conj : op === "square" ? square : op === "mulZ" ? mul : z;

  // ขยายกรอบให้เห็นผลลัพธ์เสมอ — z² โตเร็วมากจนหลุดกรอบคงที่ได้ง่าย
  const span = Math.max(
    BASE_SPAN,
    Math.hypot(result[0], result[1]) * 1.2,
    Math.hypot(a, b) * 1.2,
  );
  const bounds = { xMin: -span, xMax: span, yMin: -span * 0.8, yMax: span * 0.8 };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      // ป้ายแกน — แกนตั้งคือแกนจินตภาพ
      ctx.save();
      ctx.fillStyle = theme.label;
      ctx.font = "600 12px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.fillText("Re", vp.width - 6, vp.py(0) - 8);
      ctx.textAlign = "left";
      ctx.fillText("Im", vp.px(0) + 8, 14);
      ctx.restore();

      // วงกลมรัศมี r ให้เห็นว่าโมดูลัสคือระยะจากจุดกำเนิด
      ctx.save();
      ctx.strokeStyle = theme.gridMajor;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(vp.px(0), vp.py(0), r * vp.scaleX, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ส่วนโค้งของอาร์กิวเมนต์
      ctx.save();
      ctx.strokeStyle = theme.delta;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(vp.px(0), vp.py(0), Math.min(vp.scaleX * 0.7, 34), 0, -thetaRad, thetaRad > 0);
      ctx.stroke();
      ctx.restore();

      // สามเหลี่ยม a และ b
      drawSegment(ctx, vp, [0, 0], [a, 0], { color: theme.label, width: 1.5, dash: [4, 4] });
      drawSegment(ctx, vp, [a, 0], [a, b], { color: theme.label, width: 1.5, dash: [4, 4] });

      if (op === "mulZ") {
        drawSegment(ctx, vp, [0, 0], w, { color: theme.point, width: 2.5 });
        drawPoint(ctx, vp, w[0], w[1], { color: theme.point, radius: 6, ring: theme.bg });
        drawLabel(ctx, vp, w[0], w[1], `w`, { color: theme.point, bg: theme.bg, dy: -14 });
      }

      if (op !== "none") {
        drawSegment(ctx, vp, [0, 0], result, { color: theme.delta, width: 3 });
        drawPoint(ctx, vp, result[0], result[1], { color: theme.delta, radius: 6, ring: theme.bg });
        const label = op === "conj" ? "z̄" : op === "square" ? "z²" : "zw";
        drawLabel(ctx, vp, result[0], result[1], `${label}(${fmt(result[0])}, ${fmt(result[1])})`, {
          color: theme.delta,
          bg: theme.bg,
          dy: -16,
        });
      }

      drawSegment(ctx, vp, [0, 0], z, { color: theme.curve, width: 3 });
      drawPoint(ctx, vp, a, b, { color: theme.curve, radius: 7, ring: theme.bg });
      drawLabel(ctx, vp, a, b, `z = ${fmt(a)} ${b < 0 ? "−" : "+"} ${fmt(Math.abs(b))}i`, {
        color: theme.curve,
        bg: theme.bg,
        dy: -16,
      });
    },
    [z, a, b, r, thetaRad, w, op, result],
  );

  const handlePointer = useCallback(
    (info: { x: number; y: number; phase: "down" | "move" | "up" }) => {
      const snap = (n: number) => Math.max(-4.5, Math.min(4.5, Math.round(n * 2) / 2));
      const p: [number, number] = [snap(info.x), snap(info.y)];
      if (info.phase === "down") {
        const dz = Math.hypot(info.x - z[0], info.y - z[1]);
        const dw = Math.hypot(info.x - w[0], info.y - w[1]);
        dragging.current = op === "mulZ" && dw < dz ? "w" : "z";
      }
      if (dragging.current === "w") setW(p);
      else setZ(p);
      if (info.phase === "up") dragging.current = null;
    },
    [z, w, op],
  );

  const polar = `${fmtExact(r, 3)}(cos ${fmt(thetaDeg, 1)}° + i sin ${fmt(thetaDeg, 1)}°)`;

  return (
    <VizFrame
      title="ระนาบเชิงซ้อน"
      caption="ลากจุด z แล้วดูโมดูลัส อาร์กิวเมนต์ และรูปเชิงขั้ว · เลือกโหมดคูณเพื่อเห็นว่าการคูณคือการหมุน"
      canvas={
        <VizCanvas
          bounds={bounds}
          height={height}
          square
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`จำนวนเชิงซ้อน z เท่ากับ ${fmt(a)} บวก ${fmt(b)} i โมดูลัส ${fmt(r, 3)} อาร์กิวเมนต์ ${fmt(thetaDeg, 1)} องศา`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              แสดงผลลัพธ์ของ
            </p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ["none", "แสดงแค่ z"],
                  ["conj", "สังยุค z̄"],
                  ["square", "กำลังสอง z²"],
                  ["mulZ", "ผลคูณ z × w"],
                ] as Array<[Op, string]>
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={op === k}
                  onClick={() => setOp(k)}
                  className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                    op === k
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            ในโหมดกำลังสอง สังเกตว่ามุมเพิ่มเป็นสองเท่าและระยะยกกำลังสอง — นั่นคือทฤษฎีบทเดอมัวฟร์
          </p>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "ส่วนจริง a", value: fmtExact(a) },
            { label: "ส่วนจินตภาพ b", value: fmtExact(b) },
            { label: "โมดูลัส |z|", value: fmtExact(r, 3), tone: "delta" },
            {
              label: "อาร์กิวเมนต์",
              value: `${fmt(thetaDeg, 1)}° = ${exactPi(thetaRad) ?? fmt(thetaRad, 3)}`,
            },
            { label: "รูปเชิงขั้ว", value: polar },
            { label: "z · z̄", value: fmtExact(a * a + b * b) },
          ]}
        />
      }
    />
  );
}
