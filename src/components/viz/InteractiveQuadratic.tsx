"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment, plot } from "./core/draw";
import { fmt, fmtExact } from "@/lib/utils";

const SPECS: readonly ParamSpec[] = [
  { key: "a", label: "a", min: -3, max: 3, step: 0.1, hint: "ควบคุมความกว้างและทิศทางของพาราโบลา" },
  { key: "b", label: "b", min: -8, max: 8, step: 0.1, hint: "เลื่อนแกนสมมาตรไปทางซ้ายหรือขวา" },
  { key: "c", label: "c", min: -8, max: 8, step: 0.1, hint: "คือค่า y ตอนที่ x = 0 พอดี" },
];

const DEFAULTS = { a: 1, b: -2, c: -3 };
const BOUNDS = { xMin: -8, xMax: 8, yMin: -8, yMax: 8 };

export function InteractiveQuadratic({ height = 340 }: { height?: number }) {
  const [p, setP] = useState<Record<string, number>>({ ...DEFAULTS });
  const a = p.a ?? 1;
  const b = p.b ?? 0;
  const c = p.c ?? 0;

  const safeA = Math.abs(a) < 0.05 ? (a < 0 ? -0.05 : 0.05) : a;
  const h = -b / (2 * safeA);
  const k = c - (b * b) / (4 * safeA);
  const disc = b * b - 4 * safeA * c;
  const roots =
    disc >= 0
      ? [(-b - Math.sqrt(disc)) / (2 * safeA), (-b + Math.sqrt(disc)) / (2 * safeA)]
      : null;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Parameters<typeof drawGrid>[1], theme: Parameters<typeof drawGrid>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      // แกนสมมาตร — เส้นประ เพราะไม่ใช่ส่วนหนึ่งของกราฟ แต่เป็นเส้นอ้างอิง
      if (h > vp.bounds.xMin && h < vp.bounds.xMax) {
        drawSegment(ctx, vp, [h, vp.bounds.yMin], [h, vp.bounds.yMax], {
          color: theme.delta,
          width: 1.25,
          dash: [5, 5],
        });
      }

      plot(ctx, vp, (x) => safeA * x * x + b * x + c, { color: theme.curve, width: 2.5 });

      if (roots) {
        roots.forEach((r) => {
          drawPoint(ctx, vp, r, 0, { color: theme.bg, radius: 5, ring: theme.curve });
        });
      }

      drawPoint(ctx, vp, 0, c, { color: theme.axis, radius: 4 });
      drawPoint(ctx, vp, h, k, { color: theme.delta, radius: 6.5, ring: theme.bg });
      drawLabel(ctx, vp, h, k, `(${fmtExact(h)}, ${fmtExact(k)})`, {
        color: theme.delta,
        bg: theme.bg,
        dy: -16,
      });
    },
    [safeA, b, c, h, k, roots],
  );

  const handlePointer = useCallback(
    (info: { x: number; y: number }) => {
      // ลากจุดยอดไปที่ไหน สมการก็ปรับตาม: y = a(x-h)² + k  ⇒  b = -2ah, c = ah² + k
      const nh = Math.max(-6, Math.min(6, info.x));
      const nk = Math.max(-7, Math.min(7, info.y));
      const nb = -2 * safeA * nh;
      const nc = safeA * nh * nh + nk;
      setP((prev) => ({
        ...prev,
        b: Math.max(-8, Math.min(8, Math.round(nb * 10) / 10)),
        c: Math.max(-8, Math.min(8, Math.round(nc * 10) / 10)),
      }));
    },
    [safeA],
  );

  const sign = (n: number) => (n < 0 ? "−" : "+");

  return (
    <VizFrame
      title="พาราโบลาของ y = ax² + bx + c"
      caption="เลื่อนแถบ a b c หรือลากจุดยอดสีส้มบนกราฟโดยตรง แล้วดูว่าอะไรเปลี่ยนตาม"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`กราฟพาราโบลา y = ${fmt(a)}x² ${sign(b)} ${fmt(Math.abs(b))}x ${sign(c)} ${fmt(Math.abs(c))} จุดยอดอยู่ที่ (${fmt(h)}, ${fmt(k)})`}
        />
      }
      controls={
        <ParameterPanel
          specs={SPECS}
          values={p}
          onChange={(k2, v) => setP((prev) => ({ ...prev, [k2]: v }))}
          onReset={() => setP({ ...DEFAULTS })}
        />
      }
      readout={
        <Readout
          rows={[
            { label: "จุดยอด", value: `(${fmtExact(h)}, ${fmtExact(k)})`, tone: "delta" },
            { label: "แกนสมมาตร", value: `x = ${fmtExact(h)}` },
            { label: "b² − 4ac", value: fmtExact(disc) },
            {
              label: "รากของสมการ",
              value: roots
                ? `${fmtExact(roots[0] ?? 0)}, ${fmtExact(roots[1] ?? 0)}`
                : "ไม่มีรากจริง",
            },
            { label: "ตัดแกน y", value: `(0, ${fmtExact(c)})` },
            { label: a > 0 ? "ค่าต่ำสุด" : "ค่าสูงสุด", value: fmtExact(k) },
          ]}
        />
      }
    />
  );
}
