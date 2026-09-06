/**
 * สลับลำดับตัวเลือกของควิซแบบ "สุ่มแต่คงที่"
 *
 * เนื้อหาถูกเขียนโดยวางคำตอบที่ถูกไว้ข้อแรกเสมอเพื่อให้อ่านและตรวจทานง่าย
 * ถ้าปล่อยไว้แบบนั้น ผู้เรียนจะจับทางได้ภายในไม่กี่ข้อและควิซก็หมดความหมาย
 *
 * การสลับต้องขึ้นกับ seed ไม่ใช่ Math.random เพราะฝั่งเซิร์ฟเวอร์กับฝั่งเบราว์เซอร์
 * ต้องได้ลำดับเดียวกัน มิฉะนั้น React จะฟ้อง hydration mismatch
 */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** ตัวสร้างเลขสุ่มเชิงกำหนด (xorshift32) — เบาและพอสำหรับการสลับ 4 ตัวเลือก */
function rng(state: number): () => number {
  let s = state || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const next = rng(hash(seed));
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const ai = a[i]!;
    a[i] = a[j]!;
    a[j] = ai;
  }
  return a;
}

/** สลับแบบสุ่มจริงสำหรับการทำซ้ำในเบราว์เซอร์ (ใช้ได้เฉพาะหลังผู้ใช้กดเริ่มแล้ว) */
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i]!;
    a[i] = a[j]!;
    a[j] = ai;
  }
  return a;
}
