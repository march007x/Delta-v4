"use client";

import { useCallback, useMemo, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

const MIN = 0;
const MAX = 20;
const BOUNDS = { xMin: -1, xMax: MAX + 1, yMin: 0, yMax: 10 };

const PRESETS: Array<{ label: string; data: number[]; note: string }> = [
  { label: "สมมาตร", data: [8, 9, 9, 10, 10, 10, 11, 11, 12], note: "ค่าเฉลี่ยกับมัธยฐานเท่ากัน" },
  {
    label: "มีค่าผิดปกติ",
    data: [4, 5, 5, 6, 6, 6, 7, 7, 20],
    note: "ค่าเฉลี่ยถูกดึงไปทางขวา แต่มัธยฐานแทบไม่ขยับ",
  },
  { label: "กระจายมาก", data: [1, 3, 6, 9, 10, 12, 15, 18, 20], note: "ส่วนเบี่ยงเบนมาตรฐานสูง" },
];

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? a;
  return a + (b - a) * (pos - lo);
}

/**
 * สถิติเชิงพรรณนา — คลิกบนเส้นเพื่อเพิ่มข้อมูล คลิกที่จุดเดิมเพื่อลบ
 *
 * จุดสำคัญที่ต้องการให้เห็นคือ **ค่าเฉลี่ยถูกค่าผิดปกติดึงไปได้ แต่มัธยฐานไม่**
 * ซึ่งอธิบายด้วยคำพูดยากกว่าให้ลองลากข้อมูลตัวเดียวออกไปไกล ๆ ดูเอง
 */
export function InteractiveStatistics({ height = 300 }: { height?: number }) {
  const [data, setData] = useState<number[]>([...PRESETS[0]!.data]);

  const stats = useMemo(() => {
    const n = data.length;
    if (n === 0) {
      return { n: 0, mean: 0, median: 0, mode: "—", sd: 0, variance: 0, q1: 0, q3: 0, min: 0, max: 0 };
    }
    const sorted = [...data].sort((x, y) => x - y);
    const mean = data.reduce((s, x) => s + x, 0) / n;
    const median = quantile(sorted, 0.5);
    const variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / n;

    const freq = new Map<number, number>();
    data.forEach((x) => freq.set(x, (freq.get(x) ?? 0) + 1));
    const maxFreq = Math.max(...freq.values());
    const modes = [...freq.entries()].filter(([, c]) => c === maxFreq).map(([v]) => v);

    return {
      n,
      mean,
      median,
      mode: maxFreq === 1 ? "ไม่มีฐานนิยม" : modes.map((m) => fmt(m)).join(", "),
      sd: Math.sqrt(variance),
      variance,
      q1: quantile(sorted, 0.25),
      q3: quantile(sorted, 0.75),
      min: sorted[0] ?? 0,
      max: sorted[n - 1] ?? 0,
    };
  }, [data]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);

      const axisY = vp.height - 46;
      const boxY = vp.height - 24;

      // เส้นจำนวนและขีดบอกค่า
      ctx.save();
      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vp.px(MIN) - 8, axisY);
      ctx.lineTo(vp.px(MAX) + 8, axisY);
      ctx.stroke();

      ctx.fillStyle = theme.label;
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let t = MIN; t <= MAX; t++) {
        const px = vp.px(t);
        const major = t % 5 === 0;
        ctx.beginPath();
        ctx.moveTo(px, axisY - (major ? 5 : 3));
        ctx.lineTo(px, axisY + (major ? 5 : 3));
        ctx.stroke();
        if (major) ctx.fillText(String(t), px, axisY + 8);
      }
      ctx.restore();

      // จุดข้อมูลซ้อนกันเป็นแท่ง
      const counts = new Map<number, number>();
      const dotR = 7;
      data.forEach((x) => {
        const k = counts.get(x) ?? 0;
        counts.set(x, k + 1);
        ctx.save();
        ctx.beginPath();
        ctx.arc(vp.px(x), axisY - 12 - k * (dotR * 2 + 2), dotR, 0, Math.PI * 2);
        ctx.fillStyle = theme.fill;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.curve;
        ctx.stroke();
        ctx.restore();
      });

      if (data.length === 0) {
        ctx.save();
        ctx.fillStyle = theme.label;
        ctx.font = "13px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText("คลิกบนเส้นเพื่อเพิ่มข้อมูล", vp.width / 2, axisY - 60);
        ctx.restore();
        return;
      }

      // แผนภาพกล่อง
      ctx.save();
      const x1 = vp.px(stats.q1);
      const x3 = vp.px(stats.q3);
      ctx.strokeStyle = theme.point;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vp.px(stats.min), boxY);
      ctx.lineTo(x1, boxY);
      ctx.moveTo(x3, boxY);
      ctx.lineTo(vp.px(stats.max), boxY);
      ctx.stroke();
      [stats.min, stats.max].forEach((v) => {
        ctx.beginPath();
        ctx.moveTo(vp.px(v), boxY - 6);
        ctx.lineTo(vp.px(v), boxY + 6);
        ctx.stroke();
      });
      ctx.fillStyle = theme.fill;
      ctx.fillRect(x1, boxY - 9, Math.max(x3 - x1, 1), 18);
      ctx.strokeRect(x1, boxY - 9, Math.max(x3 - x1, 1), 18);
      ctx.strokeStyle = theme.point;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(vp.px(stats.median), boxY - 9);
      ctx.lineTo(vp.px(stats.median), boxY + 9);
      ctx.stroke();
      ctx.restore();

      // เส้นค่าเฉลี่ย (สีส้ม) และมัธยฐาน (สีน้ำเงิน)
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.delta;
      ctx.beginPath();
      ctx.moveTo(vp.px(stats.mean), 8);
      ctx.lineTo(vp.px(stats.mean), axisY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = theme.delta;
      ctx.font = "600 11.5px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`ค่าเฉลี่ย ${fmt(stats.mean, 2)}`, vp.px(stats.mean), 8);

      ctx.strokeStyle = theme.curve;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(vp.px(stats.median), 26);
      ctx.lineTo(vp.px(stats.median), axisY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = theme.curve;
      ctx.fillText(`มัธยฐาน ${fmt(stats.median, 2)}`, vp.px(stats.median), 26);
      ctx.restore();
    },
    [data, stats],
  );

  const handlePointer = useCallback(
    (info: { x: number; phase: "down" | "move" | "up" }) => {
      if (info.phase !== "down") return;
      const v = Math.max(MIN, Math.min(MAX, Math.round(info.x)));
      // คลิกเพิ่มข้อมูลอย่างเดียว การลบใช้ปุ่มด้านข้าง เพื่อให้พฤติกรรมเดาได้ง่าย
      setData((prev) => (prev.length >= 40 ? prev : [...prev, v]));
    },
    [],
  );

  return (
    <VizFrame
      title="สถิติเชิงพรรณนา"
      caption="คลิกบนเส้นเพื่อเพิ่มข้อมูล · เส้นประสีส้มคือค่าเฉลี่ย สีน้ำเงินคือมัธยฐาน และแถบล่างคือแผนภาพกล่อง"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`ชุดข้อมูลมี ${stats.n} ค่า ค่าเฉลี่ย ${fmt(stats.mean, 2)} มัธยฐาน ${fmt(stats.median, 2)} ส่วนเบี่ยงเบนมาตรฐาน ${fmt(stats.sd, 3)}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              ชุดข้อมูลตัวอย่าง
            </p>
            <div className="flex flex-col gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setData([...p.data])}
                  className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-left font-mono text-[12px] text-ink-3 hover:border-accent hover:text-ink"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setData((d) => d.slice(0, -1))}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
            >
              ลบตัวท้าย
            </button>
            <button
              type="button"
              onClick={() => setData([])}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
            >
              ล้าง
            </button>
          </div>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            ลองเลือก “มีค่าผิดปกติ” แล้วดูว่าเส้นสีส้มกับสีน้ำเงินแยกห่างกันแค่ไหน
          </p>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "จำนวนข้อมูล n", value: String(stats.n) },
            { label: "ค่าเฉลี่ย", value: fmtExact(stats.mean, 3), tone: "delta" },
            { label: "มัธยฐาน", value: fmtExact(stats.median, 2) },
            { label: "ฐานนิยม", value: stats.mode },
            { label: "พิสัย", value: fmtExact(stats.max - stats.min) },
            { label: "ความแปรปรวน", value: fmtExact(stats.variance, 3) },
            { label: "ส่วนเบี่ยงเบน (SD)", value: fmtExact(stats.sd, 3) },
            { label: "Q1 / Q3", value: `${fmt(stats.q1, 2)} / ${fmt(stats.q3, 2)}` },
          ]}
        />
      }
    />
  );
}
