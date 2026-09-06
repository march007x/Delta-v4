import { Viewport, niceStep } from "./viewport";
import type { VizTheme } from "./theme";

export function clear(ctx: CanvasRenderingContext2D, vp: Viewport, theme: VizTheme) {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, vp.width, vp.height);
}

export function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, theme: VizTheme) {
  const stepX = niceStep(vp.spanX);
  const stepY = niceStep(vp.spanY);

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.grid;
  ctx.beginPath();
  for (let x = Math.ceil(vp.bounds.xMin / stepX) * stepX; x <= vp.bounds.xMax; x += stepX) {
    const px = Math.round(vp.px(x)) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, vp.height);
  }
  for (let y = Math.ceil(vp.bounds.yMin / stepY) * stepY; y <= vp.bounds.yMax; y += stepY) {
    const py = Math.round(vp.py(y)) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(vp.width, py);
  }
  ctx.stroke();
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  theme: VizTheme,
  opts: { labels?: boolean } = {},
) {
  const { labels = true } = opts;
  const x0 = vp.px(0);
  const y0 = vp.py(0);

  ctx.strokeStyle = theme.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (y0 >= 0 && y0 <= vp.height) {
    ctx.moveTo(0, Math.round(y0) + 0.5);
    ctx.lineTo(vp.width, Math.round(y0) + 0.5);
  }
  if (x0 >= 0 && x0 <= vp.width) {
    ctx.moveTo(Math.round(x0) + 0.5, 0);
    ctx.lineTo(Math.round(x0) + 0.5, vp.height);
  }
  ctx.stroke();

  if (!labels) return;

  const stepX = niceStep(vp.spanX);
  const stepY = niceStep(vp.spanY);
  ctx.fillStyle = theme.label;
  ctx.font = "11px ui-monospace, monospace";

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const labelY = Math.min(Math.max(y0 + 5, 2), vp.height - 15);
  for (let x = Math.ceil(vp.bounds.xMin / stepX) * stepX; x <= vp.bounds.xMax; x += stepX) {
    if (Math.abs(x) < stepX / 2) continue;
    const px = vp.px(x);
    const half = ctx.measureText(trimNum(x)).width / 2;
    // ข้ามป้ายที่จะถูกขอบตัด — ป้ายครึ่งตัวอ่านผิดได้ เช่น -8 กลายเป็น 8
    if (px - half < 2 || px + half > vp.width - 2) continue;
    ctx.fillText(trimNum(x), px, labelY);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const labelX = Math.min(Math.max(x0 - 6, 22), vp.width - 2);
  for (let y = Math.ceil(vp.bounds.yMin / stepY) * stepY; y <= vp.bounds.yMax; y += stepY) {
    if (Math.abs(y) < stepY / 2) continue;
    const py = vp.py(y);
    if (py < 9 || py > vp.height - 9) continue;
    ctx.fillText(trimNum(y), labelX, py);
  }
}

function trimNum(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? "0" : String(r);
}

/** วาดกราฟ y = f(x) โดยตัดช่วงที่ค่าพุ่งออกนอกกรอบ (เช่น เส้นกำกับของ tan) */
export function plot(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  f: (x: number) => number,
  opts: { color: string; width?: number; dash?: number[] } = { color: "#000" },
) {
  const samples = Math.max(120, Math.min(Math.floor(vp.width), 1200));
  ctx.save();
  ctx.strokeStyle = opts.color;
  ctx.lineWidth = opts.width ?? 2.25;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (opts.dash) ctx.setLineDash(opts.dash);
  ctx.beginPath();

  const limit = vp.spanY * 12;
  let pen = false;
  for (let i = 0; i <= samples; i++) {
    const x = vp.bounds.xMin + (vp.spanX * i) / samples;
    const y = f(x);
    if (!Number.isFinite(y) || Math.abs(y) > limit) {
      pen = false;
      continue;
    }
    const px = vp.px(x);
    const py = vp.py(y);
    if (!pen) {
      ctx.moveTo(px, py);
      pen = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** ระบายพื้นที่ระหว่างกราฟกับแกน x — ใช้ตอนสอนปริพันธ์ */
export function fillUnder(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  f: (x: number) => number,
  from: number,
  to: number,
  color: string,
) {
  const samples = 240;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(vp.px(from), vp.py(0));
  for (let i = 0; i <= samples; i++) {
    const x = from + ((to - from) * i) / samples;
    const y = f(x);
    ctx.lineTo(vp.px(x), vp.py(Number.isFinite(y) ? y : 0));
  }
  ctx.lineTo(vp.px(to), vp.py(0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSegment(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  a: [number, number],
  b: [number, number],
  opts: { color: string; width?: number; dash?: number[] },
) {
  ctx.save();
  ctx.strokeStyle = opts.color;
  ctx.lineWidth = opts.width ?? 1.5;
  if (opts.dash) ctx.setLineDash(opts.dash);
  ctx.beginPath();
  ctx.moveTo(vp.px(a[0]), vp.py(a[1]));
  ctx.lineTo(vp.px(b[0]), vp.py(b[1]));
  ctx.stroke();
  ctx.restore();
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  x: number,
  y: number,
  opts: { color: string; radius?: number; ring?: string },
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const r = opts.radius ?? 5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(vp.px(x), vp.py(y), r, 0, Math.PI * 2);
  ctx.fillStyle = opts.color;
  ctx.fill();
  if (opts.ring) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = opts.ring;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  x: number,
  y: number,
  text: string,
  opts: { color: string; bg?: string; dx?: number; dy?: number },
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const px = vp.px(x) + (opts.dx ?? 9);
  const py = vp.py(y) + (opts.dy ?? -9);
  ctx.save();
  ctx.font = "600 12px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if (opts.bg) {
    const w = ctx.measureText(text).width;
    ctx.fillStyle = opts.bg;
    ctx.fillRect(px - 3, py - 9, w + 6, 18);
  }
  ctx.fillStyle = opts.color;
  ctx.fillText(text, px, py);
  ctx.restore();
}
