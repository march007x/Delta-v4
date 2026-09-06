"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment, plot } from "./core/draw";
import { fmt, fmtExact } from "@/lib/utils";

const SPECS: readonly ParamSpec[] = [
  { key: "x0", label: "x (จุดที่สนใจ)", min: -3, max: 3, step: 0.05, hint: "ลากจุดสีน้ำเงินบนกราฟก็ได้" },
  {
    key: "dx",
    label: "Δx (ระยะห่างของจุดที่สอง)",
    min: 0.01,
    max: 2,
    step: 0.01,
    hint: "ค่อย ๆ ลดลงเข้าใกล้ศูนย์ แล้วดูว่าเส้นตัดกลายเป็นอะไร",
  },
];

const DEFAULTS = { x0: 1, dx: 1.5 };
const BOUNDS = { xMin: -3.4, xMax: 3.4, yMin: -2, yMax: 8 };

const f = (x: number) => x * x;
const fPrime = (x: number) => 2 * x;

/**
 * เส้นตัด → เส้นสัมผัส
 * แนวคิดสำคัญที่สุดของแคลคูลัส แสดงด้วยการให้ผู้เรียนลด Δx ด้วยมือตัวเอง
 * แล้วเห็นว่าความชันของเส้นตัดเข้าใกล้ค่าหนึ่งจริง ๆ ไม่ใช่แค่คำพูด
 */
export function InteractiveDerivative({ height = 360 }: { height?: number }) {
  const [p, setP] = useState<Record<string, number>>({ ...DEFAULTS });
  const x0 = p.x0 ?? 1;
  const dx = Math.max(p.dx ?? 0.5, 0.01);

  const x1 = x0 + dx;
  const y0 = f(x0);
  const y1 = f(x1);
  const secantSlope = (y1 - y0) / dx;
  const tangentSlope = fPrime(x0);
  const gap = Math.abs(secantSlope - tangentSlope);

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      vp: Parameters<typeof drawGrid>[1],
      theme: Parameters<typeof drawGrid>[2],
    ) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);
      plot(ctx, vp, f, { color: theme.curve, width: 2.5 });

      // สามเหลี่ยม Δx / Δy ให้เห็นว่าความชันคือสัดส่วนของสองระยะนี้
      drawSegment(ctx, vp, [x0, y0], [x1, y0], { color: theme.label, width: 1.25, dash: [4, 4] });
      drawSegment(ctx, vp, [x1, y0], [x1, y1], { color: theme.label, width: 1.25, dash: [4, 4] });
      drawLabel(ctx, vp, (x0 + x1) / 2, y0, `Δx = ${fmt(dx)}`, {
        color: theme.label,
        bg: theme.bg,
        dx: -22,
        dy: 14,
      });
      drawLabel(ctx, vp, x1, (y0 + y1) / 2, `Δy = ${fmt(y1 - y0)}`, {
        color: theme.label,
        bg: theme.bg,
        dx: 8,
      });

      // เส้นสัมผัส (เป้าหมาย) วาดจาง ๆ ไว้ก่อน
      const tan = (x: number) => tangentSlope * (x - x0) + y0;
      drawSegment(ctx, vp, [vp.bounds.xMin, tan(vp.bounds.xMin)], [vp.bounds.xMax, tan(vp.bounds.xMax)], {
        color: theme.delta,
        width: 2,
        dash: [7, 5],
      });

      // เส้นตัด (สิ่งที่ผู้เรียนควบคุมอยู่)
      const sec = (x: number) => secantSlope * (x - x0) + y0;
      drawSegment(ctx, vp, [vp.bounds.xMin, sec(vp.bounds.xMin)], [vp.bounds.xMax, sec(vp.bounds.xMax)], {
        color: theme.point,
        width: 1.75,
      });

      drawPoint(ctx, vp, x1, y1, { color: theme.bg, radius: 5, ring: theme.point });
      drawPoint(ctx, vp, x0, y0, { color: theme.curve, radius: 6.5, ring: theme.bg });
    },
    [x0, y0, x1, y1, dx, secantSlope, tangentSlope],
  );

  const handlePointer = useCallback((info: { x: number }) => {
    const nx = Math.max(-3, Math.min(3, info.x));
    setP((prev) => ({ ...prev, x0: Math.round(nx * 20) / 20 }));
  }, []);

  return (
    <VizFrame
      title="จากเส้นตัดสู่เส้นสัมผัส — กราฟ f(x) = x²"
      caption="ลด Δx ลงเรื่อย ๆ แล้วดูว่าเส้นทึบ (เส้นตัด) ค่อย ๆ ทับเส้นประ (เส้นสัมผัส) — นี่คือความหมายของ Δx → 0"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`กราฟ f(x) = x กำลังสอง ที่ x = ${fmt(x0)} ความชันเส้นตัดเมื่อ เดลตา x = ${fmt(dx)} เท่ากับ ${fmt(secantSlope)} ส่วนความชันเส้นสัมผัสคือ ${fmt(tangentSlope)}`}
        />
      }
      controls={
        <ParameterPanel
          specs={SPECS}
          values={p}
          onChange={(k, v) => setP((prev) => ({ ...prev, [k]: v }))}
          onReset={() => setP({ ...DEFAULTS })}
        />
      }
      readout={
        <Readout
          rows={[
            { label: "ความชันเส้นตัด", value: fmtExact(secantSlope, 3) },
            { label: "ความชันเส้นสัมผัส", value: fmtExact(tangentSlope, 3), tone: "delta" },
            { label: "ต่างกันอยู่", value: fmt(gap, 3) },
            { label: "f′(x) = 2x", value: `2(${fmt(x0)}) = ${fmt(tangentSlope)}` },
          ]}
        />
      }
    />
  );
}
