"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment, plot } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

const SPECS: readonly ParamSpec[] = [
  { key: "a", label: "a (สัมประสิทธิ์ x²)", min: -4, max: 4, step: 0.5 },
  { key: "b", label: "b (สัมประสิทธิ์ x)", min: -8, max: 8, step: 0.5, hint: "ลองไล่จาก −8 ถึง 8 แล้วดูว่าจุดวิกฤตหายไปตอนไหน" },
  { key: "c", label: "c (ค่าคงตัว)", min: -6, max: 6, step: 0.5 },
];

const DEFAULTS = { a: -1.5, b: -6, c: 2 };
const BOUNDS = { xMin: -4.2, xMax: 4.2, yMin: -14, yMax: 14 };

/**
 * f′ บอกทิศ f″ บอกความโค้ง
 *
 * ปัญหาของบทนี้คือผู้เรียนท่องได้ว่า "f′ = 0 คือจุดวิกฤต" แต่นึกภาพไม่ออกว่า
 * เส้น f′ กับเส้น f สัมพันธ์กันอย่างไร — วางสองเส้นบนแกนเดียวกันแล้วทุกอย่างชัดขึ้นทันที
 */
export function InteractiveExtrema({ height = 400 }: { height?: number }) {
  const [p, setP] = useState<Record<string, number>>({ ...DEFAULTS });
  const [showD1, setShowD1] = useState(true);
  const [showD2, setShowD2] = useState(false);

  const a = p.a ?? 0;
  const b = p.b ?? 0;
  const c = p.c ?? 0;

  const f = (x: number) => x * x * x + a * x * x + b * x + c;
  const f1 = (x: number) => 3 * x * x + 2 * a * x + b;
  const f2 = (x: number) => 6 * x + 2 * a;

  // จุดวิกฤตคือรากของ f′ ซึ่งเป็นสมการกำลังสอง
  const disc = 4 * a * a - 12 * b;
  const crit: number[] =
    disc < 0 ? [] : disc === 0 ? [-a / 3] : [(-2 * a - Math.sqrt(disc)) / 6, (-2 * a + Math.sqrt(disc)) / 6];
  const inflect = -a / 3;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme);

      // เส้นแนวตั้งที่จุดวิกฤต — ให้เห็นว่า f′ ตัดศูนย์ตรงกับ f ราบพอดี
      for (const x of crit) {
        drawSegment(ctx, vp, [x, vp.bounds.yMin], [x, vp.bounds.yMax], {
          color: theme.label,
          width: 1.25,
          dash: [4, 4],
        });
      }

      if (showD2) plot(ctx, vp, f2, { color: theme.point, width: 1.75, dash: [2, 4] });
      if (showD1) plot(ctx, vp, f1, { color: theme.delta, width: 2, dash: [7, 4] });
      plot(ctx, vp, f, { color: theme.curve, width: 2.75 });

      // จุดเปลี่ยนเว้า
      drawPoint(ctx, vp, inflect, f(inflect), { color: theme.bg, radius: 5, ring: theme.point });

      for (const x of crit) {
        const kind = f2(x) > 0 ? "ต่ำสุด" : f2(x) < 0 ? "สูงสุด" : "ราบ";
        drawPoint(ctx, vp, x, f(x), { color: theme.curve, radius: 6, ring: theme.bg });
        drawLabel(ctx, vp, x, f(x), kind, {
          color: theme.curve,
          bg: theme.bg,
          dy: f2(x) > 0 ? 18 : -16,
        });
      }
    },
    [a, b, c, crit, inflect, showD1, showD2],
  );

  const nature = (x: number) => (f2(x) > 0 ? "ต่ำสุด" : f2(x) < 0 ? "สูงสุด" : "ตรวจเพิ่ม");
  /** เขียนพจน์ให้เครื่องหมายอ่านได้ — "+ -3x" อ่านไม่รู้เรื่อง */
  const term = (k: number, sym: string) => `${k < 0 ? "−" : "+"} ${fmt(Math.abs(k))}${sym}`;

  return (
    <VizFrame
      title="f′ บอกทิศทาง · f″ บอกความโค้ง"
      caption="เส้นทึบคือ f · เส้นประสีส้มคือ f′ · สังเกตว่าทุกครั้งที่เส้นประตัดแกน x เส้นทึบจะราบพอดี"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          ariaLabel={`กราฟ f(x) = x กำลังสาม บวก ${fmt(a)} x กำลังสอง บวก ${fmt(b)} x บวก ${fmt(c)} มีจุดวิกฤต ${crit.length} จุด`}
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
          <div className="flex flex-col gap-1.5">
            {(
              [
                [showD1, setShowD1, "แสดง f′ (เส้นประส้ม)"],
                [showD2, setShowD2, "แสดง f″ (เส้นจุด)"],
              ] as Array<[boolean, (v: boolean) => void, string]>
            ).map(([on, set, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => set(!on)}
                className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                  on
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-surface text-ink-3 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            ถ้าตั้ง b ให้เป็นบวกมาก ๆ จุดวิกฤตจะหายไปทั้งคู่ — เพราะ f′ ไม่ตัดแกน x อีกต่อไป
          </p>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "f′(x)", value: `3x² ${term(2 * a, "x")} ${term(b, "")}` },
            { label: "จำนวนจุดวิกฤต", value: String(crit.length) },
            ...crit.map((x, i) => ({
              label: `จุดวิกฤต ${i + 1}`,
              value: `x = ${fmtExact(x, 3)} · ${nature(x)}`,
            })),
            { label: "จุดเปลี่ยนเว้า", value: `x = ${fmtExact(inflect, 3)}`, tone: "delta" as const },
            { label: "เว้าขึ้นเมื่อ", value: `x > ${fmtExact(inflect, 3)}` },
          ]}
        />
      }
    />
  );
}
