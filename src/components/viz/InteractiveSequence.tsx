"use client";

import { useCallback, useState } from "react";
import { VizCanvas } from "./core/VizCanvas";
import { ParameterPanel, type ParamSpec } from "./core/ParameterPanel";
import { VizFrame, Readout } from "./core/VizFrame";
import { clear, drawGrid, drawLabel, drawPoint, drawSegment } from "./core/draw";
import type { Viewport } from "./core/viewport";
import { fmt, fmtExact } from "@/lib/utils";

type Kind = "arith" | "geo";

const SPECS: Record<Kind, readonly ParamSpec[]> = {
  arith: [
    { key: "a1", label: "a₁ (พจน์แรก)", min: -10, max: 10, step: 0.5 },
    { key: "d", label: "d (ผลต่างร่วม)", min: -5, max: 5, step: 0.5, hint: "บวกทีละ d ทุกพจน์" },
    { key: "n", label: "จำนวนพจน์ n", min: 1, max: 12, step: 1 },
  ],
  geo: [
    { key: "a1", label: "a₁ (พจน์แรก)", min: -8, max: 8, step: 0.5 },
    { key: "r", label: "r (อัตราส่วนร่วม)", min: -2, max: 2, step: 0.1, hint: "คูณด้วย r ทุกพจน์" },
    { key: "n", label: "จำนวนพจน์ n", min: 1, max: 12, step: 1 },
  ],
};

const DEFAULTS: Record<Kind, Record<string, number>> = {
  arith: { a1: 2, d: 1.5, n: 8 },
  geo: { a1: 1, r: 1.5, n: 8 },
};

/**
 * ลำดับและอนุกรม — เห็นพจน์เป็นจุดบนกราฟ และเห็นผลบวกสะสมเป็นแท่งซ้อน
 *
 * จุดที่ต้องการให้ผู้เรียนเห็นคือ ลำดับเลขคณิตเรียงเป็น "เส้นตรง"
 * ส่วนลำดับเรขาคณิตโค้งขึ้นหรือลู่เข้าหาศูนย์ — รูปร่างบอกชนิดได้ทันที
 */
export function InteractiveSequence({ height = 340 }: { height?: number }) {
  const [kind, setKind] = useState<Kind>("arith");
  const [p, setP] = useState<Record<string, number>>({ ...DEFAULTS.arith });

  const a1 = p.a1 ?? 1;
  const d = p.d ?? 1;
  const r = p.r ?? 1.5;
  const n = Math.max(1, Math.round(p.n ?? 6));

  const terms: number[] = [];
  for (let i = 0; i < n; i++) {
    terms.push(kind === "arith" ? a1 + i * d : a1 * Math.pow(r, i));
  }
  const sum = terms.reduce((s, t) => s + t, 0);
  const last = terms[terms.length - 1] ?? 0;

  const maxAbs = Math.max(4, ...terms.map((t) => Math.abs(t)));
  const bounds = { xMin: -0.6, xMax: 12.6, yMin: -maxAbs * 1.15, yMax: maxAbs * 1.15 };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, vp: Viewport, theme: Parameters<typeof clear>[2]) => {
      clear(ctx, vp, theme);
      drawGrid(ctx, vp, theme);

      // แกนนอนที่ y = 0
      drawSegment(ctx, vp, [vp.bounds.xMin, 0], [vp.bounds.xMax, 0], {
        color: theme.axis,
        width: 1.5,
      });

      terms.forEach((t, i) => {
        const x = i + 1;
        drawSegment(ctx, vp, [x, 0], [x, t], { color: theme.curve, width: 3 });
        drawPoint(ctx, vp, x, t, { color: theme.curve, radius: 5, ring: theme.bg });
      });

      // เชื่อมยอดพจน์ด้วยเส้นบาง ๆ ให้เห็นรูปร่างของลำดับ
      ctx.save();
      ctx.strokeStyle = theme.delta;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      terms.forEach((t, i) => {
        const px = vp.px(i + 1);
        const py = vp.py(t);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      // ป้ายบอกดัชนีพจน์
      ctx.save();
      ctx.fillStyle = theme.label;
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      terms.forEach((_, i) => {
        if (n > 8 && i % 2 === 1) return;
        ctx.fillText(String(i + 1), vp.px(i + 1), vp.py(0) + 6);
      });
      ctx.restore();

      const lastT = terms[terms.length - 1] ?? 0;
      drawLabel(ctx, vp, n, lastT, `aₙ = ${fmt(lastT)}`, {
        color: theme.curve,
        bg: theme.bg,
        dx: -70,
        dy: lastT >= 0 ? -16 : 16,
      });
    },
    [terms, n],
  );

  const specs = SPECS[kind];
  const nthFormula =
    kind === "arith"
      ? `aₙ = ${fmtExact(a1)} + (n − 1)(${fmtExact(d)})`
      : `aₙ = ${fmtExact(a1)} · (${fmtExact(r)})ⁿ⁻¹`;

  const converges = kind === "geo" && Math.abs(r) < 1 && r !== 0;
  const infiniteSum = converges ? a1 / (1 - r) : null;

  return (
    <VizFrame
      title={kind === "arith" ? "ลำดับเลขคณิต" : "ลำดับเรขาคณิต"}
      caption={
        kind === "arith"
          ? "ยอดของแต่ละพจน์เรียงเป็นเส้นตรงเสมอ เพราะบวกด้วยค่าเท่ากันทุกครั้ง"
          : "ยอดโค้งขึ้นเมื่อ |r| > 1 และลู่เข้าหาศูนย์เมื่อ |r| < 1"
      }
      canvas={
        <VizCanvas
          bounds={bounds}
          height={height}
          draw={draw}
          ariaLabel={`${kind === "arith" ? "ลำดับเลขคณิต" : "ลำดับเรขาคณิต"} ${n} พจน์แรกคือ ${terms
            .map((t) => fmt(t))
            .join(", ")} ผลบวกเท่ากับ ${fmt(sum)}`}
        />
      }
      controls={
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            {(
              [
                ["arith", "ลำดับเลขคณิต (บวกทีละ d)"],
                ["geo", "ลำดับเรขาคณิต (คูณทีละ r)"],
              ] as Array<[Kind, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => {
                  setKind(k);
                  setP({ ...DEFAULTS[k] });
                }}
                className={`rounded-md border px-2.5 py-1.5 text-left font-mono text-[12px] ${
                  kind === k
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-surface text-ink-3 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ParameterPanel
            specs={specs}
            values={p}
            onChange={(k, v) => setP((prev) => ({ ...prev, [k]: v }))}
            onReset={() => setP({ ...DEFAULTS[kind] })}
          />
        </div>
      }
      readout={
        <Readout
          rows={[
            { label: "พจน์ทั่วไป", value: nthFormula },
            { label: `พจน์ที่ ${n}`, value: fmtExact(last, 3) },
            { label: `ผลบวก S${n > 9 ? "ₙ" : "ₙ"}`, value: fmtExact(sum, 3), tone: "delta" },
            ...(kind === "geo"
              ? [
                  {
                    label: "อนุกรมอนันต์",
                    value: infiniteSum !== null ? fmtExact(infiniteSum, 3) : "ลู่ออก (|r| ≥ 1)",
                  },
                ]
              : []),
          ]}
        />
      }
    />
  );
}
