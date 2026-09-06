"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment, plot } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

interface Case {
  key: string;
  name: string;
  expr: string;
  a: number;
  /** ค่าฟังก์ชัน — คืน NaN ตรงจุดที่ไม่นิยาม */
  f: (x: number) => number;
  left: number | null;
  right: number | null;
  /** ค่าที่จุด a เอง (null = ไม่นิยามที่จุดนั้น) */
  at: number | null;
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  verdict: string;
  note: string;
}

const CASES: Case[] = [
  {
    key: "removable",
    name: "รูโหว่",
    expr: "f(x) = (x² − 1)/(x − 1)",
    a: 1,
    f: (x) => (Math.abs(x - 1) < 1e-12 ? NaN : (x * x - 1) / (x - 1)),
    left: 2,
    right: 2,
    at: null,
    bounds: { xMin: -1.5, xMax: 3.5, yMin: -1, yMax: 5 },
    verdict: "ลิมิตมีค่า = 2 แต่ f(1) ไม่นิยาม",
    note: "ลิมิตไม่สนใจว่าจุดนั้นมีค่าอะไร สนใจแค่ว่ารอบ ๆ จุดนั้นค่าเข้าใกล้อะไร",
  },
  {
    key: "jump",
    name: "กระโดด",
    expr: "f(x) = x + 1 เมื่อ x < 1 · 4 − x เมื่อ x ≥ 1",
    a: 1,
    f: (x) => (x < 1 ? x + 1 : 4 - x),
    left: 2,
    right: 3,
    at: 3,
    bounds: { xMin: -1.5, xMax: 3.5, yMin: -1, yMax: 5 },
    verdict: "ลิมิตไม่มีค่า — ซ้ายได้ 2 ขวาได้ 3",
    note: "ลิมิตจะมีค่าได้ก็ต่อเมื่อสองข้างเข้าใกล้เลขเดียวกันเท่านั้น",
  },
  {
    key: "infinite",
    name: "พุ่งอนันต์",
    expr: "f(x) = 1/(x − 1)²",
    a: 1,
    f: (x) => (Math.abs(x - 1) < 1e-12 ? NaN : 1 / ((x - 1) * (x - 1))),
    left: null,
    right: null,
    at: null,
    bounds: { xMin: -1.5, xMax: 3.5, yMin: -1, yMax: 12 },
    verdict: "ลิมิตไม่มีค่า — ทั้งสองข้างพุ่งขึ้น ∞",
    note: "เขียนว่า lim = ∞ ได้ แต่ต้องเข้าใจว่านั่นแปลว่า \"ไม่มีลิมิต\" ในความหมายของจำนวนจริง",
  },
  {
    key: "sinc",
    name: "sin x / x",
    expr: "f(x) = sin x / x",
    a: 0,
    f: (x) => (Math.abs(x) < 1e-12 ? NaN : Math.sin(x) / x),
    left: 1,
    right: 1,
    at: null,
    bounds: { xMin: -6.5, xMax: 6.5, yMin: -0.6, yMax: 1.6 },
    verdict: "ลิมิตมีค่า = 1 (ลิมิตพื้นฐานของตรีโกณ)",
    note: "แทน x = 0 ตรง ๆ จะได้ 0/0 ซึ่งบอกอะไรไม่ได้ — ต้องดูพฤติกรรมรอบ ๆ แทน",
  },
  {
    key: "sign",
    name: "|x| / x",
    expr: "f(x) = |x| / x",
    a: 0,
    f: (x) => (Math.abs(x) < 1e-12 ? NaN : Math.abs(x) / x),
    left: -1,
    right: 1,
    at: null,
    bounds: { xMin: -3.5, xMax: 3.5, yMin: -2, yMax: 2 },
    verdict: "ลิมิตไม่มีค่า — ซ้ายได้ −1 ขวาได้ 1",
    note: "ค่าสัมบูรณ์คือจุดที่นักเรียนพลาดบ่อยที่สุด เพราะมันเปลี่ยนเครื่องหมายตรงศูนย์พอดี",
  },
];

const DELTAS = [1, 0.5, 0.25, 0.1, 0.05, 0.01, 0.001];

/**
 * ลิมิตคือ "ค่าที่ฟังก์ชันเข้าใกล้" ไม่ใช่ "ค่าที่จุดนั้น"
 *
 * ผู้เรียนบีบ δ ลงเองทีละขั้น แล้วเห็นเลขสองฝั่งวิ่งเข้าหากัน (หรือไม่วิ่งเข้าหากัน)
 * ตัวเลขในตารางคือหลักฐาน ส่วนกราฟคือสัญชาตญาณ — ต้องมีทั้งสองอย่าง
 */
export function InteractiveLimit({ height = 360 }: { height?: number }) {
  const [caseKey, setCaseKey] = useState<string>("removable");
  const [di, setDi] = useState(0);

  const c: Case = CASES.find((x) => x.key === caseKey) ?? (CASES[0] as Case);
  const delta = DELTAS[di] ?? 1;
  const xl = c.a - delta;
  const xr = c.a + delta;
  const yl = c.f(xl);
  const yr = c.f(xr);
  const agree = c.left !== null && c.right !== null && Math.abs(c.left - c.right) < 1e-9;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);

      // แถบ |x − a| < δ ให้เห็นว่า "รอบ ๆ จุด" กว้างแค่ไหน
      ctx.save();
      ctx.fillStyle = theme.fill;
      ctx.fillRect(vp.px(c.a - delta), 0, Math.max(2, 2 * delta * vp.scaleX), vp.height);
      ctx.restore();

      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      // เส้นแนวตั้งที่ x = a
      drawSegment(ctx, vp, [c.a, vp.bounds.yMin], [c.a, vp.bounds.yMax], {
        color: theme.label,
        width: 1.25,
        dash: [5, 5],
      });

      // เส้นแนวนอนที่ค่าลิมิต — วาดเมื่อสองข้างตรงกันเท่านั้น
      if (agree && c.left !== null) {
        drawSegment(ctx, vp, [vp.bounds.xMin, c.left], [vp.bounds.xMax, c.left], {
          color: theme.delta,
          width: 1.5,
          dash: [7, 4],
        });
        drawLabel(ctx, vp, vp.bounds.xMin, c.left, `L = ${fmtExact(c.left, 3)}`, {
          color: theme.delta,
          bg: theme.bg,
          dx: 8,
          dy: -12,
        });
      }

      // กราฟ — ฟังก์ชันกระโดดต้องวาดแยกสองท่อน ไม่งั้นจะมีเส้นตั้งเชื่อมปลอม ๆ
      if (c.key === "jump" || c.key === "sign") {
        plot(ctx, vp, (x) => (x < c.a - 1e-9 ? c.f(x) : NaN), { color: theme.curve, width: 2.5 });
        plot(ctx, vp, (x) => (x > c.a + 1e-9 ? c.f(x) : NaN), { color: theme.curve, width: 2.5 });
      } else {
        plot(ctx, vp, c.f, { color: theme.curve, width: 2.5 });
      }

      // จุดโหว่ (วงกลมกลวง) ตรงที่ฟังก์ชันไม่นิยาม
      if (c.at === null && c.left !== null && agree) {
        drawPoint(ctx, vp, c.a, c.left, { color: theme.bg, radius: 5.5, ring: theme.curve });
      }
      if (c.key === "jump") {
        drawPoint(ctx, vp, c.a, 2, { color: theme.bg, radius: 5.5, ring: theme.curve });
        drawPoint(ctx, vp, c.a, 3, { color: theme.curve, radius: 5.5, ring: theme.bg });
      }
      if (c.key === "sign") {
        drawPoint(ctx, vp, c.a, -1, { color: theme.bg, radius: 5.5, ring: theme.curve });
        drawPoint(ctx, vp, c.a, 1, { color: theme.bg, radius: 5.5, ring: theme.curve });
      }

      // จุดทดสอบสองฝั่ง
      if (Number.isFinite(yl)) {
        drawPoint(ctx, vp, xl, yl, { color: theme.point, radius: 5, ring: theme.bg });
        drawLabel(ctx, vp, xl, yl, "ซ้าย", { color: theme.point, bg: theme.bg, dx: -34, dy: -14 });
      }
      if (Number.isFinite(yr)) {
        drawPoint(ctx, vp, xr, yr, { color: theme.point, radius: 5, ring: theme.bg });
        drawLabel(ctx, vp, xr, yr, "ขวา", { color: theme.point, bg: theme.bg, dy: -14 });
      }
    },
    [c, delta, xl, xr, yl, yr, agree],
  );

  return (
    <VizFrame
      title="ลิมิต — ค่าที่เข้าใกล้ ไม่ใช่ค่าที่จุดนั้น"
      caption="บีบ δ ลงทีละขั้น แล้วดูว่าเลขสองฝั่งวิ่งเข้าหากันหรือไม่ · ลองสลับกรณีเพื่อเห็นแบบที่ลิมิตไม่มีค่า"
      canvas={
        <VizCanvas
          bounds={c.bounds}
          height={height}
          draw={draw}
          ariaLabel={`${c.expr} ที่ x เข้าใกล้ ${fmt(c.a)} เมื่อ เดลตา เท่ากับ ${delta} ค่าทางซ้ายคือ ${fmt(yl, 4)} ค่าทางขวาคือ ${fmt(yr, 4)}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              กรณีศึกษา
            </p>
            <p className="m-0 mb-2 font-mono text-[12.5px] leading-snug text-ink">{c.expr}</p>
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
              <label htmlFor="limit-delta" className="font-mono text-[12.5px] font-medium text-ink-2">
                δ (ระยะห่างจาก a)
              </label>
              <span className="font-mono text-[13px] tabular-nums text-accent-ink">{delta}</span>
            </div>
            <input
              id="limit-delta"
              type="range"
              min={0}
              max={DELTAS.length - 1}
              step={1}
              value={di}
              onChange={(e) => setDi(Number(e.target.value))}
            />
            <p className="m-0 text-[12px] leading-snug text-ink-3">
              เลื่อนไปขวาคือเข้าใกล้ x = {fmt(c.a)} มากขึ้น
            </p>
          </div>

          <div className="rounded-md border border-line bg-surface px-2.5 py-2">
            <p className="m-0 font-mono text-[12px] font-semibold text-delta">{c.verdict}</p>
            <p className="m-0 mt-1 text-[12px] leading-snug text-ink-2">{c.note}</p>
          </div>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: `f(${fmt(c.a)} − δ)`, value: Number.isFinite(yl) ? fmt(yl, 5) : "—" },
            { label: `f(${fmt(c.a)} + δ)`, value: Number.isFinite(yr) ? fmt(yr, 5) : "—" },
            {
              label: "ลิมิตซ้าย",
              value: c.left === null ? "ไม่มีค่า" : fmtExact(c.left, 3),
            },
            {
              label: "ลิมิตขวา",
              value: c.right === null ? "ไม่มีค่า" : fmtExact(c.right, 3),
            },
            { label: `f(${fmt(c.a)})`, value: c.at === null ? "ไม่นิยาม" : fmtExact(c.at, 3) },
            { label: "สรุป", value: agree ? `ลิมิต = ${fmtExact(c.left!, 3)}` : "ลิมิตไม่มีค่า", tone: "delta" },
          ]}
        />
      }
    />
  );
}
