"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawSegment, plot } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

type Method = "left" | "right" | "mid" | "trapezoid";

interface Case {
  key: string;
  name: string;
  expr: string;
  f: (x: number) => number;
  a: number;
  b: number;
  exact: number;
  exactLabel: string;
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
}

const CASES: Case[] = [
  {
    key: "sq",
    name: "x²",
    expr: "∫₀² x² dx",
    f: (x) => x * x,
    a: 0,
    b: 2,
    exact: 8 / 3,
    exactLabel: "8/3",
    bounds: { xMin: -0.4, xMax: 2.6, yMin: -0.6, yMax: 4.6 },
  },
  {
    key: "sin",
    name: "sin x",
    expr: "∫₀^π sin x dx",
    f: (x) => Math.sin(x),
    a: 0,
    b: Math.PI,
    exact: 2,
    exactLabel: "2",
    bounds: { xMin: -0.4, xMax: 3.6, yMin: -0.3, yMax: 1.35 },
  },
  {
    key: "sqrt",
    name: "√x",
    expr: "∫₀⁴ √x dx",
    f: (x) => Math.sqrt(Math.max(x, 0)),
    a: 0,
    b: 4,
    exact: 16 / 3,
    exactLabel: "16/3",
    bounds: { xMin: -0.7, xMax: 5, yMin: -0.5, yMax: 2.6 },
  },
  {
    key: "inv",
    name: "1/x",
    expr: "∫₁³ (1/x) dx",
    f: (x) => 1 / x,
    a: 1,
    b: 3,
    exact: Math.log(3),
    exactLabel: "ln 3",
    bounds: { xMin: 0.2, xMax: 3.6, yMin: -0.3, yMax: 1.5 },
  },
];

const METHODS: Array<[Method, string]> = [
  ["left", "ปลายซ้าย"],
  ["right", "ปลายขวา"],
  ["mid", "จุดกึ่งกลาง"],
  ["trapezoid", "สี่เหลี่ยมคางหมู"],
];

function riemann(c: Case, n: number, method: Method): number {
  const h = (c.b - c.a) / n;
  let s = 0;
  if (method === "trapezoid") {
    s = (c.f(c.a) + c.f(c.b)) / 2;
    for (let i = 1; i < n; i++) s += c.f(c.a + i * h);
    return s * h;
  }
  for (let i = 0; i < n; i++) {
    const x =
      method === "left" ? c.a + i * h : method === "right" ? c.a + (i + 1) * h : c.a + (i + 0.5) * h;
    s += c.f(x);
  }
  return s * h;
}

/**
 * ผลรวมรีมันน์ → ปริพันธ์จำกัดเขต
 *
 * ประเด็นที่ต้องเห็นด้วยตาคือ **ช่องว่างระหว่างแท่งกับเส้นโค้งหายไปเมื่อ n โตขึ้น**
 * และวิธีจุดกึ่งกลางแม่นกว่าปลายซ้าย/ขวาที่ n เท่ากัน ซึ่งอธิบายด้วยคำพูดอย่างเดียวไม่พอ
 */
export function InteractiveIntegral({ height = 360 }: { height?: number }) {
  const [caseKey, setCaseKey] = useState<string>("sq");
  const [n, setN] = useState(6);
  const [method, setMethod] = useState<Method>("left");

  const c: Case = CASES.find((x) => x.key === caseKey) ?? (CASES[0] as Case);
  const approx = riemann(c, n, method);
  const err = approx - c.exact;
  const h = (c.b - c.a) / n;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);

      const y0 = vp.py(0);
      ctx.save();
      ctx.fillStyle = theme.fill;
      ctx.strokeStyle = theme.delta;
      ctx.lineWidth = 1.25;

      for (let i = 0; i < n; i++) {
        const xa = c.a + i * h;
        const xb = xa + h;
        if (method === "trapezoid") {
          ctx.beginPath();
          ctx.moveTo(vp.px(xa), y0);
          ctx.lineTo(vp.px(xa), vp.py(c.f(xa)));
          ctx.lineTo(vp.px(xb), vp.py(c.f(xb)));
          ctx.lineTo(vp.px(xb), y0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          const xs = method === "left" ? xa : method === "right" ? xb : (xa + xb) / 2;
          const hy = c.f(xs);
          const top = vp.py(hy);
          ctx.beginPath();
          ctx.rect(vp.px(xa), Math.min(top, y0), vp.px(xb) - vp.px(xa), Math.abs(y0 - top));
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();

      drawAxes(ctx, vp, theme);
      plot(ctx, vp, c.f, { color: theme.curve, width: 2.75 });

      // ขอบเขตการอินทิเกรต
      for (const x of [c.a, c.b]) {
        drawSegment(ctx, vp, [x, vp.bounds.yMin], [x, vp.bounds.yMax], {
          color: theme.label,
          width: 1.25,
          dash: [4, 4],
        });
      }
    },
    [c, n, h, method],
  );

  return (
    <VizFrame
      title="ผลรวมรีมันน์ — พื้นที่ใต้กราฟจากแท่งสี่เหลี่ยม"
      caption="เพิ่มจำนวนแท่ง n แล้วดูค่าประมาณวิ่งเข้าหาค่าจริง · ลองเทียบวิธีปลายซ้าย ปลายขวา และจุดกึ่งกลางที่ n เท่ากัน"
      canvas={
        <VizCanvas
          bounds={c.bounds}
          height={height}
          draw={draw}
          ariaLabel={`${c.expr} ประมาณด้วย ${n} แท่ง วิธี ${method} ได้ ${fmt(approx, 5)} ค่าจริงคือ ${fmt(c.exact, 5)}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              ปริพันธ์
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CASES.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  aria-pressed={caseKey === k.key}
                  onClick={() => setCaseKey(k.key)}
                  className={`rounded-md border px-2 py-1 font-mono text-[11.5px] ${
                    caseKey === k.key
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {k.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="riemann-n" className="font-mono text-[12.5px] font-medium text-ink-2">
                จำนวนแท่ง n
              </label>
              <span className="font-mono text-[13px] tabular-nums text-accent-ink">{n}</span>
            </div>
            <input
              id="riemann-n"
              type="range"
              min={1}
              max={60}
              step={1}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
            <p className="m-0 text-[12px] leading-snug text-ink-3">
              ความกว้างแต่ละแท่ง Δx = {fmt(h, 4)}
            </p>
          </div>

          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              เลือกความสูงจาก
            </p>
            <div className="flex flex-wrap gap-1.5">
              {METHODS.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={method === k}
                  onClick={() => setMethod(k)}
                  className={`rounded-md border px-2 py-1 font-mono text-[11.5px] ${
                    method === k
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "ค่าประมาณ", value: fmt(approx, 6) },
            { label: "ค่าจริง", value: c.exactLabel, tone: "delta" },
            { label: "ค่าจริง (ทศนิยม)", value: fmt(c.exact, 6) },
            { label: "คลาดเคลื่อน", value: fmt(err, 6) },
            { label: "คลาดเคลื่อนสัมพัทธ์", value: `${fmt((Math.abs(err) / Math.abs(c.exact)) * 100, 3)}%` },
            { label: "Δx", value: fmtExact(h, 4) },
          ]}
        />
      }
    />
  );
}
