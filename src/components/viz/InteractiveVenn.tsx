"use client";

import { useCallback, useMemo, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame } from "./core/VizFrame";
import { clear } from "./core/draw";
import type { Viewport } from "./core/viewport";

const R = 0.62;
const CENTERS: Array<[number, number]> = [
  [-0.34, 0.22],
  [0.34, 0.22],
  [0, -0.36],
];
const NAMES = ["A", "B", "C"] as const;
const BOUNDS = { xMin: -1.5, xMax: 1.5, yMin: -1.35, yMax: 1.15 };

/** ทุกส่วนย่อยของแผนภาพ = ทุกสับเซตของ {A, B, C} รวมส่วนนอกวงทั้งหมด = 8 ส่วน */
const REGIONS = Array.from({ length: 8 }, (_, m) => ({
  mask: m,
  inA: (m & 1) !== 0,
  inB: (m & 2) !== 0,
  inC: (m & 4) !== 0,
}));

type Pred = (a: boolean, b: boolean, c: boolean) => boolean;

const EXPRESSIONS: Array<{ label: string; f: Pred }> = [
  { label: "∅ (เซตว่าง)", f: () => false },
  { label: "U (เอกภพสัมพัทธ์)", f: () => true },
  { label: "A", f: (a) => a },
  { label: "B", f: (_a, b) => b },
  { label: "C", f: (_a, _b, c) => c },
  { label: "A′", f: (a) => !a },
  { label: "A ∪ B", f: (a, b) => a || b },
  { label: "A ∩ B", f: (a, b) => a && b },
  { label: "A − B", f: (a, b) => a && !b },
  { label: "B − A", f: (a, b) => b && !a },
  { label: "A ∪ B ∪ C", f: (a, b, c) => a || b || c },
  { label: "A ∩ B ∩ C", f: (a, b, c) => a && b && c },
  { label: "(A ∪ B)′", f: (a, b) => !(a || b) },
  { label: "A′ ∩ B′", f: (a, b) => !a && !b },
  { label: "(A ∩ B)′", f: (a, b) => !(a && b) },
  { label: "A′ ∪ B′", f: (a, b) => !a || !b },
  { label: "A ∩ (B ∪ C)", f: (a, b, c) => a && (b || c) },
  { label: "(A ∩ B) ∪ (A ∩ C)", f: (a, b, c) => (a && b) || (a && c) },
  { label: "A ∪ (B ∩ C)", f: (a, b, c) => a || (b && c) },
  { label: "(A ∪ B) ∩ (A ∪ C)", f: (a, b, c) => (a || b) && (a || c) },
  { label: "(A ∪ B) − C", f: (a, b, c) => (a || b) && !c },
  { label: "(A ∩ B) − C", f: (a, b, c) => a && b && !c },
  { label: "A △ B (ผลต่างสมมาตร)", f: (a, b) => a !== b },
];

function maskOf(f: Pred): number {
  let m = 0;
  for (const r of REGIONS) if (f(r.inA, r.inB, r.inC)) m |= 1 << r.mask;
  return m;
}

const EXPR_MASKS = EXPRESSIONS.map((e) => ({ label: e.label, mask: maskOf(e.f) }));

/**
 * แผนภาพเวนน์ 3 วง — คลิกเลือกส่วนที่ต้องการระบาย
 * แล้วระบบจะบอกว่าส่วนที่เลือกตรงกับนิพจน์เซตแบบไหนบ้าง
 * ถ้าตรงมากกว่าหนึ่งแบบ แปลว่านิพจน์เหล่านั้นเท่ากัน — เห็นกฎเดอมอร์แกนได้ด้วยตา
 */
export function InteractiveVenn({ height = 340 }: { height?: number }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const selMask = useMemo(() => {
    let m = 0;
    selected.forEach((r) => (m |= 1 << r));
    return m;
  }, [selected]);

  const matches = EXPR_MASKS.filter((e) => e.mask === selMask).map((e) => e.label);

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      vp: Viewport,
      theme: Parameters<typeof clear>[2],
    ) => {
      clear(ctx, vp, theme);

      const r = R * vp.scaleX;
      const cx = CENTERS.map(([x, y]) => [vp.px(x), vp.py(y)] as [number, number]);

      // ระบายทีละส่วนบน canvas ชั่วคราวแยกกัน
      // ต้องแยกกัน เพราะการ "ลบวงที่ไม่รวม" ของส่วนหนึ่ง จะไปลบสีของส่วนอื่นที่ระบายไว้ก่อนหน้า
      if (selected.size > 0) {
        const scratch = document.createElement("canvas");
        scratch.width = ctx.canvas.width;
        scratch.height = ctx.canvas.height;
        const o = scratch.getContext("2d");
        if (o) {
          const dpr = ctx.canvas.width / vp.width;
          selected.forEach((maskIndex) => {
            const inc = [0, 1, 2].filter((i) => (maskIndex & (1 << i)) !== 0);
            const exc = [0, 1, 2].filter((i) => (maskIndex & (1 << i)) === 0);

            o.setTransform(1, 0, 0, 1, 0, 0);
            o.globalCompositeOperation = "source-over";
            o.clearRect(0, 0, scratch.width, scratch.height);
            o.setTransform(dpr, 0, 0, dpr, 0, 0);

            o.save();
            for (const i of inc) {
              o.beginPath();
              o.arc(cx[i]![0], cx[i]![1], r, 0, Math.PI * 2);
              o.clip();
            }
            // ใช้สีเส้นกราฟที่ความโปร่ง 0.24 เพื่อให้เห็นชัดทั้งธีมสว่างและธีมมืด
            o.globalAlpha = 0.24;
            o.fillStyle = theme.curve;
            o.fillRect(0, 0, vp.width, vp.height);
            o.globalAlpha = 1;
            o.globalCompositeOperation = "destination-out";
            for (const i of exc) {
              o.beginPath();
              o.arc(cx[i]![0], cx[i]![1], r, 0, Math.PI * 2);
              o.fill();
            }
            o.restore();

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(scratch, 0, 0);
            ctx.restore();
          });
        }
      }

      // กรอบเอกภพสัมพัทธ์
      ctx.save();
      ctx.strokeStyle = theme.gridMajor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, 3, vp.width - 6, vp.height - 6);
      ctx.fillStyle = theme.label;
      ctx.font = "600 13px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("U", 10, 8);

      ctx.strokeStyle = theme.axis;
      ctx.lineWidth = 2;
      cx.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.fillStyle = theme.curve;
      ctx.font = "700 16px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      NAMES.forEach((n, i) => {
        const [x, y] = CENTERS[i]!;
        const ox = x === 0 ? 0 : x > 0 ? 0.42 : -0.42;
        const oy = x === 0 ? -0.44 : 0.34;
        ctx.fillText(n, vp.px(x + ox), vp.py(y + oy));
      });
      ctx.restore();
    },
    [selected],
  );

  const handlePointer = useCallback(
    (info: { x: number; y: number; phase: string }) => {
      if (info.phase !== "down") return;
      let m = 0;
      CENTERS.forEach(([x, y], i) => {
        const d = Math.hypot(info.x - x, info.y - y);
        if (d <= R) m |= 1 << i;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(m)) next.delete(m);
        else next.add(m);
        return next;
      });
    },
    [],
  );

  return (
    <VizFrame
      title="แผนภาพเวนน์ — คลิกเพื่อระบายส่วนที่ต้องการ"
      caption="ระบายแล้วดูว่านิพจน์เซตแบบไหนให้ภาพเดียวกัน ถ้าขึ้นมากกว่าหนึ่งบรรทัด แปลว่านิพจน์เหล่านั้นเท่ากัน"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          square
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`แผนภาพเวนน์สามวง A B C ขณะนี้ระบายไว้ ${selected.size} ส่วนจาก 8 ส่วน${
            matches.length ? ` ตรงกับนิพจน์ ${matches.join(" และ ")}` : ""
          }`}
        />
      }
      controls={
        <div className="flex flex-col gap-2">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
            เลือกด้วยปุ่มก็ได้
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {REGIONS.map((r) => {
              const inc = NAMES.filter((_, i) => (r.mask & (1 << i)) !== 0);
              const exc = NAMES.filter((_, i) => (r.mask & (1 << i)) === 0);
              const label =
                inc.length === 0
                  ? "นอกทุกวง"
                  : inc.join("∩") + (exc.length ? "−" + exc.join("−") : "");
              const on = selected.has(r.mask);
              return (
                <button
                  key={r.mask}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.mask)) next.delete(r.mask);
                      else next.add(r.mask);
                      return next;
                    })
                  }
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                    on
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line bg-surface text-ink-3 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="self-start rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
          >
            ล้างทั้งหมด
          </button>
        </div>
      }
      readout={
        <div className="border-t border-line pt-3">
          <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
            นิพจน์ที่ตรงกับภาพนี้
          </p>
          {matches.length === 0 ? (
            <p className="m-0 font-mono text-[12.5px] text-ink-3">
              ไม่ตรงกับนิพจน์มาตรฐานในรายการ — ลองเลือกส่วนอื่นดู
            </p>
          ) : (
            <ul className="m-0 list-none space-y-1 p-0">
              {matches.map((m) => (
                <li key={m} className="font-mono text-[13px] text-accent-ink">
                  {m}
                </li>
              ))}
            </ul>
          )}
          {matches.length > 1 ? (
            <p className="m-0 mt-2 text-[12.5px] leading-snug text-ink-3">
              นิพจน์เหล่านี้ให้ภาพเดียวกัน จึงเป็นเซตเดียวกัน
            </p>
          ) : null}
        </div>
      }
    />
  );
}
