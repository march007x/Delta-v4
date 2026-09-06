"use client";

import { useCallback, useMemo, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt } from "@/lib/utils";

type Experiment = "coin" | "die" | "twoDice";

interface ExpDef {
  label: string;
  outcomes: string[];
  /** ความน่าจะเป็นทางทฤษฎีของแต่ละผลลัพธ์ */
  theory: number[];
  roll: () => number;
  note: string;
}

const EXPERIMENTS: Record<Experiment, ExpDef> = {
  coin: {
    label: "โยนเหรียญ 1 เหรียญ",
    outcomes: ["หัว", "ก้อย"],
    theory: [1 / 2, 1 / 2],
    roll: () => (Math.random() < 0.5 ? 0 : 1),
    note: "ผลลัพธ์ 2 แบบ โอกาสเท่ากัน",
  },
  die: {
    label: "ทอดลูกเต๋า 1 ลูก",
    outcomes: ["1", "2", "3", "4", "5", "6"],
    theory: Array(6).fill(1 / 6),
    roll: () => Math.floor(Math.random() * 6),
    note: "ผลลัพธ์ 6 แบบ โอกาสเท่ากัน",
  },
  twoDice: {
    label: "ทอดลูกเต๋า 2 ลูก (ดูผลรวม)",
    outcomes: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    theory: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((c) => c / 36),
    roll: () =>
      Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6),
    note: "ผลรวม 7 เกิดง่ายที่สุดเพราะมีวิธีเกิดได้ 6 แบบ",
  },
};

/**
 * การจำลองความน่าจะเป็น — กดทดลองซ้ำ ๆ แล้วดูว่าความถี่สัมพัทธ์
 * ค่อย ๆ ลู่เข้าหาความน่าจะเป็นทางทฤษฎี (กฎของจำนวนมาก)
 *
 * แท่งทึบคือผลจากการทดลองจริง เส้นประคือค่าทางทฤษฎี
 * ยิ่งทดลองมาก แท่งยิ่งเข้าใกล้เส้นประ — เห็นได้ด้วยตาโดยไม่ต้องอธิบาย
 */
export function InteractiveProbability({ height = 320 }: { height?: number }) {
  const [exp, setExp] = useState<Experiment>("die");
  const [counts, setCounts] = useState<number[]>(() => Array(6).fill(0));

  const def = EXPERIMENTS[exp];
  const total = counts.reduce((s, c) => s + c, 0);

  const freqs = useMemo(
    () => counts.map((c) => (total > 0 ? c / total : 0)),
    [counts, total],
  );

  const maxY = Math.max(0.35, ...def.theory, ...freqs) * 1.25;
  const bounds = { xMin: 0, xMax: def.outcomes.length, yMin: 0, yMax: maxY };

  const run = useCallback(
    (times: number) => {
      setCounts((prev) => {
        const next = [...prev];
        for (let i = 0; i < times; i++) {
          const o = def.roll();
          if (o >= 0 && o < next.length) next[o] = (next[o] ?? 0) + 1;
        }
        return next;
      });
    },
    [def],
  );

  const switchExp = (e: Experiment) => {
    setExp(e);
    setCounts(Array(EXPERIMENTS[e].outcomes.length).fill(0));
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      const n = def.outcomes.length;
      const bw = vp.width / n;

      // เส้นแนวนอนอ้างอิง
      ctx.save();
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      for (let g = 0; g <= 5; g++) {
        const y = vp.py((maxY * g) / 5);
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(vp.width, Math.round(y) + 0.5);
        ctx.stroke();
      }
      ctx.restore();

      def.outcomes.forEach((label, i) => {
        const x0 = i * bw + bw * 0.18;
        const w = bw * 0.64;
        const base = vp.py(0);

        // แท่งจากการทดลองจริง
        const h = base - vp.py(freqs[i] ?? 0);
        ctx.save();
        ctx.fillStyle = theme.fill;
        ctx.fillRect(x0, base - h, w, h);
        ctx.strokeStyle = theme.curve;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0, base - h, w, h);

        // เส้นประของค่าทางทฤษฎี
        const ty = vp.py(def.theory[i] ?? 0);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = theme.delta;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 - bw * 0.06, ty);
        ctx.lineTo(x0 + w + bw * 0.06, ty);
        ctx.stroke();
        ctx.restore();

        // ป้ายผลลัพธ์
        ctx.save();
        ctx.fillStyle = theme.label;
        ctx.font = "11px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, x0 + w / 2, base + 5);
        ctx.restore();
      });

      // เส้นฐาน
      ctx.save();
      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(vp.py(0)) + 0.5);
      ctx.lineTo(vp.width, Math.round(vp.py(0)) + 0.5);
      ctx.stroke();
      ctx.restore();
    },
    [def, freqs, maxY],
  );

  // ค่าคลาดเคลื่อนสูงสุดระหว่างการทดลองกับทฤษฎี — ตัวเลขที่ควรลดลงเมื่อทดลองมากขึ้น
  const maxGap =
    total > 0
      ? Math.max(...freqs.map((f, i) => Math.abs(f - (def.theory[i] ?? 0))))
      : 0;

  return (
    <VizFrame
      title="การจำลองความน่าจะเป็น"
      caption="แท่งทึบคือผลจากการทดลองจริง เส้นประคือค่าทางทฤษฎี — ยิ่งทดลองมาก แท่งยิ่งเข้าใกล้เส้นประ"
      canvas={
        <VizCanvas
          bounds={bounds}
          height={height}
          draw={draw}
          ariaLabel={`ผลการทดลอง ${def.label} จำนวน ${total} ครั้ง ความถี่สัมพัทธ์ของแต่ละผลลัพธ์คือ ${def.outcomes
            .map((o, i) => `${o} เท่ากับ ${fmt(freqs[i] ?? 0, 3)}`)
            .join(", ")}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div>
            <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
              การทดลอง
            </p>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(EXPERIMENTS) as Experiment[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={exp === k}
                  onClick={() => switchExp(k)}
                  className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                    exp === k
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {EXPERIMENTS[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 10, 100, 1000].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => run(t)}
                className="rounded-lg border border-accent bg-accent-soft px-2.5 py-1.5 font-mono text-[11.5px] text-accent-ink hover:opacity-90"
              >
                +{t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCounts(Array(def.outcomes.length).fill(0))}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
            >
              ล้าง
            </button>
          </div>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "ทดลองไปแล้ว", value: `${total.toLocaleString("th-TH")} ครั้ง` },
            {
              label: "คลาดเคลื่อนสูงสุด",
              value: total > 0 ? fmt(maxGap, 4) : "—",
              tone: "delta",
            },
            { label: "ผลลัพธ์ทั้งหมด", value: `${def.outcomes.length} แบบ` },
            { label: "หมายเหตุ", value: def.note },
          ]}
        />
      }
    />
  );
}
