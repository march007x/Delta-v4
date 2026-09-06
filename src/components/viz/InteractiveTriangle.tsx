"use client";

import { useCallback, useRef, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawAxes, drawGrid, drawLabel, drawPoint, drawSegment } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

type Pt = [number, number];

const BOUNDS = { xMin: -1.5, xMax: 8.5, yMin: -1.5, yMax: 6.5 };
const DEFAULTS: Pt[] = [
  [0, 0],
  [6, 0],
  [4, 4],
];

const deg = (r: number) => (r * 180) / Math.PI;

/**
 * สามเหลี่ยมใด ๆ — ลากจุดยอดแล้วดูกฎไซน์กับกฎโคไซน์เป็นจริงพร้อมกันเสมอ
 *
 * ตัวเลข a/sin A, b/sin B, c/sin C ในตารางจะเท่ากันทุกครั้งไม่ว่าจะลากไปที่ไหน
 * ซึ่งเป็นหลักฐานที่หนักแน่นกว่าการอ่านบทพิสูจน์อย่างเดียว
 */
export function InteractiveTriangle({ height = 380 }: { height?: number }) {
  const [pts, setPts] = useState<Pt[]>(DEFAULTS);
  const dragging = useRef<number | null>(null);

  const A = pts[0] ?? DEFAULTS[0]!;
  const B = pts[1] ?? DEFAULTS[1]!;
  const C = pts[2] ?? DEFAULTS[2]!;

  // ด้านตรงข้ามมุมชื่อเดียวกัน: a ตรงข้าม A
  const a = Math.hypot(B[0] - C[0], B[1] - C[1]);
  const b = Math.hypot(A[0] - C[0], A[1] - C[1]);
  const c = Math.hypot(A[0] - B[0], A[1] - B[1]);

  const safeAcos = (v: number) => Math.acos(Math.max(-1, Math.min(1, v)));
  const angA = safeAcos((b * b + c * c - a * a) / (2 * b * c));
  const angB = safeAcos((a * a + c * c - b * b) / (2 * a * c));
  const angC = Math.PI - angA - angB;

  // พื้นที่จากสูตรรองเท้าผูก — ตรวจกับ ½ab sin C ได้
  const area = Math.abs(
    (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])) / 2,
  );
  // รัศมีวงกลมล้อม จากกฎไซน์รูปเต็ม a/sin A = 2R
  const R = a / (2 * Math.sin(angA));

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);
      drawAxes(ctx, vp, theme, { labels: false });

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(vp.px(A[0]), vp.py(A[1]));
      ctx.lineTo(vp.px(B[0]), vp.py(B[1]));
      ctx.lineTo(vp.px(C[0]), vp.py(C[1]));
      ctx.closePath();
      ctx.fillStyle = theme.fill;
      ctx.fill();
      ctx.strokeStyle = theme.curve;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();

      // ป้ายความยาวด้านวางไว้กลางด้าน
      const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      drawLabel(ctx, vp, ...mid(B, C), `a = ${fmt(a, 2)}`, {
        color: theme.delta,
        bg: theme.bg,
        dx: 6,
      });
      drawLabel(ctx, vp, ...mid(A, C), `b = ${fmt(b, 2)}`, {
        color: theme.delta,
        bg: theme.bg,
        dx: -60,
      });
      drawLabel(ctx, vp, ...mid(A, B), `c = ${fmt(c, 2)}`, {
        color: theme.delta,
        bg: theme.bg,
        dy: 16,
      });

      const verts: Array<[Pt, string, number]> = [
        [A, "A", angA],
        [B, "B", angB],
        [C, "C", angC],
      ];
      for (const [p, name, ang] of verts) {
        drawPoint(ctx, vp, p[0], p[1], { color: theme.curve, radius: 7, ring: theme.bg });
        drawLabel(ctx, vp, p[0], p[1], `${name} = ${fmt(deg(ang), 1)}°`, {
          color: theme.point,
          bg: theme.bg,
          dy: -16,
        });
      }
      // เส้นประจากจุดกึ่งกลางฐานไปยอด ช่วยให้เห็นความสูงคร่าว ๆ
      drawSegment(ctx, vp, mid(A, B), C, { color: theme.label, width: 1, dash: [3, 5] });
    },
    [A, B, C, a, b, c, angA, angB, angC],
  );

  const handlePointer = useCallback(
    (info: { x: number; y: number; phase: "down" | "move" | "up" }) => {
      const snap = (n: number) => Math.round(n * 2) / 2;
      if (info.phase === "down") {
        let best = 0;
        let bestD = Infinity;
        pts.forEach((p, i) => {
          const d = Math.hypot(info.x - p[0], info.y - p[1]);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        dragging.current = best;
      }
      const i = dragging.current;
      if (i === null) return;
      const next: Pt = [
        Math.max(-1, Math.min(8, snap(info.x))),
        Math.max(-1, Math.min(6, snap(info.y))),
      ];
      setPts((prev) => prev.map((p, k) => (k === i ? next : p)));
      if (info.phase === "up") dragging.current = null;
    },
    [pts],
  );

  const ratio = (side: number, ang: number) => (Math.sin(ang) < 1e-9 ? "—" : fmt(side / Math.sin(ang), 3));

  return (
    <VizFrame
      title="กฎไซน์และกฎโคไซน์ในสามเหลี่ยมใด ๆ"
      caption="ลากจุดยอดทั้งสามได้อิสระ · สังเกตว่าอัตราส่วนสามตัวในตารางเท่ากันเสมอ ไม่ว่าสามเหลี่ยมจะรูปร่างอย่างไร"
      canvas={
        <VizCanvas
          bounds={BOUNDS}
          height={height}
          square
          draw={draw}
          onPointer={handlePointer}
          ariaLabel={`สามเหลี่ยมที่มีด้านยาว ${fmt(a, 2)}, ${fmt(b, 2)}, ${fmt(c, 2)} และมุม ${fmt(deg(angA), 1)}, ${fmt(deg(angB), 1)}, ${fmt(deg(angC), 1)} องศา`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
            รูปสำเร็จรูป
          </p>
          <div className="flex flex-col gap-1.5">
            {(
              [
                ["สามเหลี่ยมมุมฉาก", [[0, 0], [6, 0], [0, 4]]],
                ["สามเหลี่ยมด้านเท่า", [[1, 0], [6, 0], [3.5, 4.5]]],
                ["มุมป้าน", [[0, 0], [7, 0], [1, 3]]],
                ["กลับค่าเริ่มต้น", DEFAULTS],
              ] as Array<[string, Pt[]]>
            ).map(([label, v]) => (
              <button
                key={label}
                type="button"
                onClick={() => setPts(v.map((p) => [...p] as Pt))}
                className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-left font-mono text-[12px] text-ink-3 hover:border-line-strong hover:text-ink"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="m-0 text-[12px] leading-snug text-ink-3">
            สามเหลี่ยมด้านเท่าเป็นค่าประมาณ เพราะจุดยอดถูกบังคับให้ลงบนเส้นกริดครึ่งหน่วย
          </p>
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "a / sin A", value: ratio(a, angA), tone: "delta" },
            { label: "b / sin B", value: ratio(b, angB), tone: "delta" },
            { label: "c / sin C", value: ratio(c, angC), tone: "delta" },
            { label: "ผลรวมมุม", value: `${fmt(deg(angA + angB + angC), 1)}°` },
            { label: "พื้นที่", value: fmtExact(area, 3) },
            { label: "½ ab sin C", value: fmt((a * b * Math.sin(angC)) / 2, 3) },
            { label: "รัศมีวงล้อม R", value: fmt(R, 3) },
          ]}
        />
      }
    />
  );
}
