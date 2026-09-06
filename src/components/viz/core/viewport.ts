export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * แปลงพิกัดคณิตศาสตร์ ↔ พิกเซล
 * ทุก visualization ใช้ตัวนี้ร่วมกัน จึงมีพฤติกรรม zoom/pan/สัดส่วนเหมือนกันหมด
 */
export class Viewport {
  readonly width: number;
  readonly height: number;
  readonly bounds: Bounds;

  constructor(width: number, height: number, bounds: Bounds) {
    this.width = width;
    this.height = height;
    this.bounds = bounds;
  }

  get spanX(): number {
    return this.bounds.xMax - this.bounds.xMin;
  }
  get spanY(): number {
    return this.bounds.yMax - this.bounds.yMin;
  }
  /** พิกเซลต่อ 1 หน่วยคณิตศาสตร์ */
  get scaleX(): number {
    return this.width / this.spanX;
  }
  get scaleY(): number {
    return this.height / this.spanY;
  }

  px(x: number): number {
    return (x - this.bounds.xMin) * this.scaleX;
  }
  py(y: number): number {
    return this.height - (y - this.bounds.yMin) * this.scaleY;
  }
  mathX(px: number): number {
    return this.bounds.xMin + px / this.scaleX;
  }
  mathY(py: number): number {
    return this.bounds.yMin + (this.height - py) / this.scaleY;
  }

  /** ยืดกรอบให้สัดส่วนแกน x และ y เท่ากัน (จำเป็นกับวงกลมหนึ่งหน่วยและเวกเตอร์) */
  static square(width: number, height: number, bounds: Bounds): Viewport {
    const vp = new Viewport(width, height, bounds);
    const unit = Math.min(vp.scaleX, vp.scaleY);
    const halfX = width / unit / 2;
    const halfY = height / unit / 2;
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cy = (bounds.yMin + bounds.yMax) / 2;
    return new Viewport(width, height, {
      xMin: cx - halfX,
      xMax: cx + halfX,
      yMin: cy - halfY,
      yMax: cy + halfY,
    });
  }
}

/** เลือกระยะห่างเส้นกริดให้เป็นเลขที่คนอ่านแล้วเข้าใจ (1, 2, 5, 10, ...) */
export function niceStep(span: number, target = 8): number {
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm >= 5 ? 5 : norm >= 2 ? 2 : 1;
  return step * mag;
}
