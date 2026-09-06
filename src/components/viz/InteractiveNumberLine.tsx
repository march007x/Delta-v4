"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawLabel } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

type Mode = "lt" | "le" | "gt";

const MODES: Array<{ key: Mode; label: string }> = [
  { key: "lt", label: "|x − a| < b" },
  { key: "le", label: "|x − a| ≤ b" },
  { key: "gt", label: "|x − a| > b" },
];

const SPECS: readonly ParamSpec[] = [
  { key: "a", label: "a (จุดกึ่งกลาง)", min: -8, max: 8, step: 0.5 },
  { key: "b", label: "b (ระยะห่างที่ยอมให้)", min: 0, max: 6, step: 0.5 },
];

const BOUNDS = { xMin: -10.5, xMax: 10.5, yMin: -1, yMax: 1 };

/**
 * เส้นจำนวน — ค่าสัมบูรณ์และอสมการ
 * แนวคิดที่ต้องเห็นคือ |x − a| คือ "ระยะห่างระหว่าง x กับ a" บนเส้นจำนวน
 * เมื่อคิดแบบระยะทาง อสมการค่าสัมบูรณ์จะอ่านออกทันทีโดยไม่ต้องแยกกรณี
 */
export function InteractiveNumberLine({ height = 170 }: { height?: number }) {
  const [p, setP] = useState<Record<string, number>>({ a: 1, b: 3 });
  const [mode, setMode] = useState<Mode>("lt");
  const a = p.a ?? 0;
  const b = Math.max(p.b ?? 0, 0);
  const lo = a - b;
  const hi = a + b;
  const closed = mode === "le";

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      const y = vp.py(0);

      // แถบคำตอบ
      ctx.save();
      ctx.fillStyle = theme.fill;
      if (mode === "gt") {
        ctx.fillRect(0, y - 16, vp.px(lo), 32);
        ctx.fillRect(vp.px(hi), y - 16, vp.width - vp.px(hi), 32);
      } else {
        ctx.fillRect(vp.px(lo), y - 16, vp.px(hi) - vp.px(lo), 32);
      }

      // เส้นจำนวนและขีดบอกค่า
      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vp.width, y);
      ctx.stroke();

      ctx.fillStyle = theme.label;
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let t = -10; t <= 10; t++) {
        const px = vp.px(t);
        const major = t % 5 === 0;
        ctx.beginPath();
        ctx.moveTo(px, y - (major ? 7 : 4));
        ctx.lineTo(px, y + (major ? 7 : 4));
        ctx.stroke();
        if (major) ctx.fillText(String(t), px, y + 11);
      }

      // แถบคำตอบเส้นหนา
      ctx.strokeStyle = theme.curve;
      ctx.lineWidth = 5;
      ctx.lineCap = "butt";
      ctx.beginPath();
      if (mode === "gt") {
        ctx.moveTo(0, y);
        ctx.lineTo(vp.px(lo), y);
        ctx.moveTo(vp.px(hi), y);
        ctx.lineTo(vp.width, y);
      } else {
        ctx.moveTo(vp.px(lo), y);
        ctx.lineTo(vp.px(hi), y);
      }
      ctx.stroke();

      // จุดปลาย — ทึบคือรวมค่านั้น กลวงคือไม่รวม
      [lo, hi].forEach((v) => {
        ctx.beginPath();
        ctx.arc(vp.px(v), y, 6, 0, Math.PI * 2);
        ctx.fillStyle = closed ? theme.curve : theme.bg;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = theme.curve;
        ctx.stroke();
      });

      // จุดกึ่งกลาง a และลูกศรบอกระยะ b
      ctx.beginPath();
      ctx.arc(vp.px(a), y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = theme.delta;
      ctx.fill();
      ctx.restore();

      drawLabel(ctx, vp, a, 0, `a = ${fmt(a)}`, { color: theme.delta, bg: theme.bg, dx: -24, dy: -26 });
      if (b > 0) {
        drawLabel(ctx, vp, (a + hi) / 2, 0, `b = ${fmt(b)}`, {
          color: theme.label,
          bg: theme.bg,
          dx: -20,
          dy: -26,
        });
      }
    },
    [a, b, lo, hi, mode, closed],
  );

  const interval =
    b === 0
      ? mode === "gt"
        ? `(−∞, ${fmtExact(a)}) ∪ (${fmtExact(a)}, ∞)`
        : mode === "le"
          ? `{${fmtExact(a)}}`
          : "∅ (ไม่มีคำตอบ)"
      : mode === "gt"
        ? `(−∞, ${fmtExact(lo)}) ∪ (${fmtExact(hi)}, ∞)`
        : mode === "le"
          ? `[${fmtExact(lo)}, ${fmtExact(hi)}]`
          : `(${fmtExact(lo)}, ${fmtExact(hi)})`;

  const meaning =
    mode === "gt"
      ? `ห่างจาก ${fmtExact(a)} เกิน ${fmtExact(b)}`
      : `ห่างจาก ${fmtExact(a)} ไม่เกิน ${fmtExact(b)}`;

  return (
    <VizFrame
      title="ค่าสัมบูรณ์บนเส้นจำนวน"
      caption="|x − a| คือระยะห่างระหว่าง x กับ a — เมื่อคิดเป็นระยะทาง อสมการค่าสัมบูรณ์อ่านออกได้ทันที"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          ariaLabel={`เส้นจำนวนแสดงเซตคำตอบของอสมการ ${MODES.find((m) => m.key === mode)?.label} เมื่อ a เท่ากับ ${fmt(a)} และ b เท่ากับ ${fmt(b)} ได้เซตคำตอบ ${interval}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              รูปแบบอสมการ
            </p>
            <div className="flex flex-col gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={mode === m.key}
                  onClick={() => setMode(m.key)}
                  className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                    mode === m.key
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <ParameterPanel
            specs={SPECS}
            values={p}
            onChange={(k, v) => setP((prev) => ({ ...prev, [k]: v }))}
            onReset={() => setP({ a: 1, b: 3 })}
          />
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "เซตคำตอบ", value: interval, tone: "delta" },
            { label: "ความหมาย", value: meaning },
            { label: "จุดปลาย", value: closed ? "รวมปลาย (ทึบ)" : "ไม่รวมปลาย (กลวง)" },
          ]}
        />
      }
    />
  );
}
