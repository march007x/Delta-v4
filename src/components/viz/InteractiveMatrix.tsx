"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

const SPECS: readonly ParamSpec[] = [
  { key: "a", label: "a (แถว 1 หลัก 1)", min: -3, max: 3, step: 0.25 },
  { key: "b", label: "b (แถว 1 หลัก 2)", min: -3, max: 3, step: 0.25 },
  { key: "c", label: "c (แถว 2 หลัก 1)", min: -3, max: 3, step: 0.25 },
  { key: "d", label: "d (แถว 2 หลัก 2)", min: -3, max: 3, step: 0.25 },
];

const PRESETS: Array<[string, Record<string, number>]> = [
  ["เอกลักษณ์", { a: 1, b: 0, c: 0, d: 1 }],
  ["ขยาย 2 เท่า", { a: 2, b: 0, c: 0, d: 2 }],
  ["หมุน 90°", { a: 0, b: -1, c: 1, d: 0 }],
  ["สะท้อนแกน x", { a: 1, b: 0, c: 0, d: -1 }],
  ["เฉือน", { a: 1, b: 1, c: 0, d: 1 }],
  ["ดีเทอร์มิแนนต์ 0", { a: 1, b: 2, c: 2, d: 4 }],
];

const DEFAULTS = { a: 1, b: 1, c: 0, d: 1 };
const BOUNDS = { xMin: -4.5, xMax: 4.5, yMin: -3.5, yMax: 3.5 };

/**
 * เมทริกซ์ 2×2 คือ "การแปลงระนาบ" ไม่ใช่แค่ตารางตัวเลข
 *
 * ประเด็นที่ตำราไทยมักข้ามไปคือ **ดีเทอร์มิแนนต์ = อัตราส่วนพื้นที่**
 * ซึ่งอธิบายทันทีว่าทำไม det = 0 ถึงหาอินเวอร์สไม่ได้ (พื้นที่ยุบเป็นศูนย์ ย้อนกลับไม่ได้)
 */
export function InteractiveMatrix({ height = 380 }: { height?: number }) {
  const [p, setP] = useState<Record<string, number>>({ ...DEFAULTS });

  const a = p.a ?? 1;
  const b = p.b ?? 0;
  const c = p.c ?? 0;
  const d = p.d ?? 1;
  const det = a * d - b * c;
  const invertible = Math.abs(det) > 1e-9;

  const apply = (x: number, y: number): [number, number] => [a * x + b * y, c * x + d * y];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      // สี่เหลี่ยมจัตุรัสหนึ่งหน่วยก่อนแปลง — พื้นที่ 1 เสมอ
      ctx.save();
      ctx.strokeStyle = theme.label;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(vp.px(0), vp.py(1), vp.scaleX, vp.scaleY);
      ctx.restore();

      // ภาพของสี่เหลี่ยมหลังแปลง — กลายเป็นสี่เหลี่ยมด้านขนาน
      const corners: Array<[number, number]> = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ].map(([x, y]) => apply(x as number, y as number));

      ctx.save();
      ctx.beginPath();
      corners.forEach((pt, i) => {
        const px = vp.px(pt[0]);
        const py = vp.py(pt[1]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = theme.fill;
      ctx.fill();
      ctx.strokeStyle = theme.curve;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // เวกเตอร์ฐาน — คอลัมน์ของเมทริกซ์คือภาพของ i และ j พอดี
      const i2 = apply(1, 0);
      const j2 = apply(0, 1);
      drawSegment(ctx, vp, [0, 0], i2, { color: theme.curve, width: 3 });
      drawSegment(ctx, vp, [0, 0], j2, { color: theme.delta, width: 3 });
      drawPoint(ctx, vp, i2[0], i2[1], { color: theme.curve, radius: 5.5, ring: theme.bg });
      drawPoint(ctx, vp, j2[0], j2[1], { color: theme.delta, radius: 5.5, ring: theme.bg });
      drawLabel(ctx, vp, i2[0], i2[1], `î → (${fmt(i2[0])}, ${fmt(i2[1])})`, {
        color: theme.curve,
        bg: theme.bg,
        dy: -14,
      });
      drawLabel(ctx, vp, j2[0], j2[1], `ĵ → (${fmt(j2[0])}, ${fmt(j2[1])})`, {
        color: theme.delta,
        bg: theme.bg,
        dy: -14,
      });
    },
    [a, b, c, d],
  );

  return (
    <VizFrame
      title="เมทริกซ์ 2×2 คือการแปลงระนาบ"
      caption="กรอบเส้นประคือสี่เหลี่ยมหนึ่งหน่วยก่อนแปลง · รูปทึบคือภาพหลังแปลง · พื้นที่ของรูปทึบคือ |det| พอดี"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          square
          draw={draw}
          ariaLabel={`เมทริกซ์ ${fmt(a)} ${fmt(b)} ${fmt(c)} ${fmt(d)} มีดีเทอร์มิแนนต์ ${fmt(det)}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <ParameterPanel
            specs={SPECS}
            values={p}
            onChange={(k, v) => setP((prev) => ({ ...prev, [k]: v }))}
            onReset={() => setP({ ...DEFAULTS })}
          />
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              ตัวอย่างสำเร็จรูป
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(([label, v]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setP({ ...v })}
                  className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11.5px] text-ink-3 hover:border-line-strong hover:text-ink"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            ลองกด “ดีเทอร์มิแนนต์ 0” จะเห็นสี่เหลี่ยมยุบเป็นเส้นตรง — พื้นที่หายไปหมด จึงย้อนกลับไม่ได้
          </p>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "det A", value: fmtExact(det, 3), tone: "delta" },
            { label: "พื้นที่หลังแปลง", value: fmtExact(Math.abs(det), 3) },
            { label: "หาอินเวอร์สได้ไหม", value: invertible ? "ได้" : "ไม่ได้" },
            {
              label: "แถว 1 ของ A⁻¹",
              value: invertible ? `${fmtExact(d / det, 3)}, ${fmtExact(-b / det, 3)}` : "—",
            },
            {
              label: "แถว 2 ของ A⁻¹",
              value: invertible ? `${fmtExact(-c / det, 3)}, ${fmtExact(a / det, 3)}` : "—",
            },
            { label: "พลิกทิศหรือไม่", value: det < 0 ? "พลิก (สะท้อน)" : det > 0 ? "ไม่พลิก" : "ยุบ" },
          ]}
        />
      }
    />
  );
}
