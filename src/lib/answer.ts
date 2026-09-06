/**
 * ตรวจคำตอบที่ผู้เรียนพิมพ์เอง
 *
 * ต้องยอมรับหลายรูปแบบ เพราะคนหนึ่งตอบ 8/3 อีกคนตอบ 2.67 ซึ่งถูกทั้งคู่
 * ถ้าบังคับรูปแบบเดียว จะกลายเป็นการวัดว่าพิมพ์ตรงสเปกไหม ไม่ใช่วัดว่าคิดถูกไหม
 */

/** แปลงสิ่งที่พิมพ์เป็นตัวเลข — รองรับเศษส่วน ทศนิยม ลบ และเว้นวรรค/จุลภาค */
export function parseNumericAnswer(raw: string): number | null {
  const t = raw
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    // ผู้เรียนไทยพิมพ์ − (ขีดยาว) และ – มาบ่อยพอ ๆ กับ -
    .replace(/[−–—]/g, "-");
  if (t === "") return null;

  const frac = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(t);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }

  if (!/^-?\d*\.?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * ความคลาดเคลื่อนที่ยอมรับโดยปริยาย = 0.5% ของคำตอบ
 *
 * ผ่อนพอให้คนที่ปัดทศนิยมสองตำแหน่งตอบถูก แต่ยังแคบพอที่จะจับคนคิดผิดจริง
 * ข้อที่ต้องการความแม่นต่างจากนี้ ให้กำหนด tolerance ในเนื้อหาเอง
 */
export function toleranceFor(answer: number, tolerance?: number): number {
  return tolerance ?? Math.max(1e-9, Math.abs(answer) * 0.005);
}

export function isNumericCorrect(raw: string, answer: number, tolerance?: number): boolean {
  const v = parseNumericAnswer(raw);
  if (v === null) return false;
  return Math.abs(v - answer) <= toleranceFor(answer, tolerance);
}
