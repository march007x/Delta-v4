"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment } from "./core/draw";
import { fmt, fmtExact } from "@/lib/utils";
import { exactPi, exactWithDecimal } from "@/lib/math/exact";

const SPECS: readonly ParamSpec[] = [
  {
    key: "deg",
    label: "θ (องศา)",
    min: -360,
    max: 720,
    step: 1,
    hint: "ลากจุดบนวงกลมก็ได้ · ลองเลื่อนเกิน 360° แล้วดูว่าค่ากลับมาซ้ำ",
  },
];

const BOUNDS = { xMin: -1.9, xMax: 1.9, yMin: -1.6, yMax: 1.6 };

function quadrant(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  if (d === 0 || d === 90 || d === 180 || d === 270) return "บนแกนพอดี";
  if (d < 90) return "1 · sin+ cos+";
  if (d < 180) return "2 · sin+ cos−";
  if (d < 270) return "3 · sin− cos−";
  return "4 · sin− cos+";
}

/** มุมอ้างอิง: มุมแหลมที่ทำกับแกน x ซึ่งเป็นตัวกำหนด "ขนาด" ของค่าตรีโกณ */
function referenceAngle(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  if (d <= 90) return d;
  if (d <= 180) return 180 - d;
  if (d <= 270) return d - 180;
  return 360 - d;
}

/**
 * วงกลมหนึ่งหน่วย — จุดที่ผู้เรียนต้องเห็นคือ
 * cos คือ "ระยะตามแนวนอน" และ sin คือ "ระยะตามแนวตั้ง" ของจุดบนวงกลม
 * ไม่ใช่ตัวย่อที่ต้องท่องว่าข้าม/ฉาก
 */
export function InteractiveUnitCircle({ height = 380 }: { height?: number }) {
  const [p, setP] = useState<Record<string, number>>({ deg: 45 });
  const deg = p.deg ?? 0;
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tanDefined = Math.abs(cos) > 1e-6;
  const tan = tanDefined ? sin / cos : NaN;

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      vp: Parameters<typeof drawGrid>[1],
      theme: Parameters<typeof drawGrid>[2],
    ) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme, { labels: false });

      // วงกลมรัศมี 1
      ctx.save();
      ctx.strokeStyle = theme.gridMajor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(vp.px(0), vp.py(0), vp.scaleX, 0, Math.PI * 2);
      ctx.stroke();

      // ส่วนโค้งที่กวาดไปแล้ว — ทำให้เห็นว่ามุมคือ "การหมุน" ไม่ใช่รูปสามเหลี่ยม
      ctx.strokeStyle = theme.delta;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(vp.px(0), vp.py(0), vp.scaleX * 0.28, 0, -rad, rad > 0);
      ctx.stroke();
      ctx.restore();

      // cos = ระยะแนวนอน (บนแกน x) · sin = ระยะแนวตั้ง
      drawSegment(ctx, vp, [0, 0], [cos, 0], { color: theme.curve, width: 4 });
      drawSegment(ctx, vp, [cos, 0], [cos, sin], { color: theme.delta, width: 4 });
      drawSegment(ctx, vp, [0, 0], [cos, sin], { color: theme.point, width: 1.75 });

      // เส้นสัมผัสที่ x = 1 — ความยาวช่วงนี้คือค่า tan พอดี
      if (tanDefined && Math.abs(tan) < 3) {
        drawSegment(ctx, vp, [1, 0], [1, tan], { color: theme.label, width: 2.5, dash: [4, 3] });
        drawLabel(ctx, vp, 1, tan / 2, `tan = ${fmt(tan)}`, {
          color: theme.label,
          bg: theme.bg,
          dx: 8,
        });
      }

      drawPoint(ctx, vp, cos, sin, { color: theme.point, radius: 7, ring: theme.bg });
      drawLabel(ctx, vp, cos, sin, `(${fmtExact(cos)}, ${fmtExact(sin)})`, {
        color: theme.point,
        bg: theme.bg,
        dx: cos > 0.4 ? -104 : 10,
        dy: sin >= 0 ? -16 : 16,
      });
      drawLabel(ctx, vp, cos / 2, 0, `cos`, { color: theme.curve, bg: theme.bg, dx: -12, dy: 15 });
      drawLabel(ctx, vp, cos, sin / 2, `sin`, { color: theme.delta, bg: theme.bg, dx: 7, dy: 0 });
    },
    [rad, cos, sin, tan, tanDefined],
  );

  const handlePointer = useCallback((info: { x: number; y: number }) => {
    const a = (Math.atan2(info.y, info.x) * 180) / Math.PI;
    setP({ deg: Math.round(((a % 360) + 360) % 360) });
  }, []);

  const radLabel = exactPi(rad) ?? `${fmt(rad, 4)} เรเดียน`;

  return (
    <VizFrame
      title="วงกลมหนึ่งหน่วย"
      caption="ลากจุดรอบวงกลม แล้วดูว่า cos คือระยะแนวนอน และ sin คือระยะแนวตั้งของจุดนั้นเสมอ"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          square
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`วงกลมหนึ่งหน่วยที่มุม ${deg} องศา จุดอยู่ที่พิกัด ${fmt(cos)}, ${fmt(sin)} ค่า sin เท่ากับ ${fmt(sin)} cos เท่ากับ ${fmt(cos)}`}
        />
      }
      controls={
        <ParameterPanel
          specs={SPECS}
          values={p}
          onChange={(k, v) => setP({ [k]: v })}
          onReset={() => setP({ deg: 45 })}
        />
      }
      readout={
        <Readout
          rows={[
            { label: "θ เป็นเรเดียน", value: radLabel },
            { label: "cos θ", value: exactWithDecimal(cos) },
            { label: "sin θ", value: exactWithDecimal(sin), tone: "delta" },
            { label: "tan θ", value: tanDefined ? exactWithDecimal(tan) : "ไม่นิยาม" },
            { label: "มุมอ้างอิง", value: `${fmt(referenceAngle(deg), 0)}°` },
            { label: "จตุภาค", value: quadrant(deg) },
            { label: "sin²+cos²", value: fmt(sin * sin + cos * cos, 3) },
          ]}
        />
      }
    />
  );
}
