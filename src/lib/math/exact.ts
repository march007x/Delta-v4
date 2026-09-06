/**
 * แปลงทศนิยมกลับเป็นค่าที่แน่นอน — เศษส่วนหรือรูปติดกรณฑ์
 *
 * ทำไมต้องมี: ในคณิตศาสตร์ระดับนี้ คำตอบที่ถูกต้องคือ 0.7071
 * ซึ่งเขียนได้ว่า √2/2 และครูให้ตอบแบบหลัง ถ้าเว็บแสดงแต่ทศนิยม
 * ผู้เรียนจะจำค่าประมาณติดหัวไปสอบ แทนที่จะจำค่าที่แน่นอน
 */

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/** หาเศษส่วน n/d ที่ตรงกับ x โดยตัวส่วนไม่เกิน maxDen (ใช้เศษส่วนต่อเนื่อง) */
export function toFraction(
  x: number,
  maxDen = 400,
  tol = 1e-9,
): { n: number; d: number } | null {
  if (!Number.isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1;
  let v = Math.abs(x);

  let n0 = 0;
  let d0 = 1;
  let n1 = 1;
  let d1 = 0;

  for (let i = 0; i < 40; i++) {
    const a = Math.floor(v);
    const n2 = a * n1 + n0;
    const d2 = a * d1 + d0;
    if (d2 > maxDen) break;
    n0 = n1;
    d0 = d1;
    n1 = n2;
    d1 = d2;
    if (Math.abs(n1 / d1 - Math.abs(x)) < tol) {
      const g = gcd(n1, d1);
      return { n: (sign * n1) / g, d: d1 / g };
    }
    const frac = v - a;
    if (frac < 1e-12) break;
    v = 1 / frac;
  }
  return null;
}

/** ดึงกำลังสองสมบูรณ์ออกจากในกรณฑ์: 12 → 2√3 จะได้ { k: 2, r: 3 } */
function simplifyRadical(m: number): { k: number; r: number } {
  let k = 1;
  let r = m;
  for (let i = 2; i * i <= r; i++) {
    while (r % (i * i) === 0) {
      r /= i * i;
      k *= i;
    }
  }
  return { k, r };
}

/**
 * คืนค่าที่แน่นอนของ x เป็นข้อความ เช่น "3/4", "√2/2", "-2√3", "5"
 * คืน null ถ้าไม่ใช่ค่าที่เขียนสวยได้ (จะได้แสดงทศนิยมตามเดิม)
 */
export function exact(x: number): string | null {
  if (!Number.isFinite(x)) return null;
  if (Math.abs(x) < 1e-12) return "0";

  // 1) เป็นเศษส่วนตรง ๆ หรือไม่
  const f = toFraction(x, 200);
  if (f) return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;

  // 2) ถ้ายกกำลังสองแล้วเป็นเศษส่วน แปลว่า x อยู่ในรูป ±√(n/d) = ±√(nd)/d
  const sq = toFraction(x * x, 200);
  if (!sq || sq.n <= 0) return null;

  const { k, r } = simplifyRadical(sq.n * sq.d);
  if (r === 1) return null; // ถอดรากได้ลงตัว — ควรถูกจับตั้งแต่ข้อ 1 แล้ว

  const g = gcd(k, sq.d);
  const num = k / g;
  const den = sq.d / g;
  const sign = x < 0 ? "-" : "";
  const head = num === 1 ? "" : String(num);
  return den === 1 ? `${sign}${head}√${r}` : `${sign}${head}√${r}/${den}`;
}

/** คืนค่าที่แน่นอนในหน่วยเรเดียน เช่น "π/4", "3π/4", "2π", "0" */
export function exactPi(x: number): string | null {
  const f = toFraction(x / Math.PI, 100);
  if (!f) return null;
  if (f.n === 0) return "0";
  const head = Math.abs(f.n) === 1 ? "" : String(Math.abs(f.n));
  const sign = f.n < 0 ? "-" : "";
  return f.d === 1 ? `${sign}${head}π` : `${sign}${head}π/${f.d}`;
}

/**
 * รูปแบบที่ใช้แสดงผลจริง — ให้ค่าที่แน่นอนมาก่อน แล้วต่อท้ายด้วยค่าประมาณ
 * เช่น "√2/2 ≈ 0.7071"  ส่วนค่าที่ไม่มีรูปแน่นอนก็แสดงทศนิยมอย่างเดียว
 */
export function exactWithDecimal(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return "—";
  const e = exact(x);
  const dec = Number(x.toFixed(digits));
  const decStr = Object.is(dec, -0) ? "0" : String(dec);
  if (!e) return decStr;
  // ถ้าค่าที่แน่นอนคือจำนวนเต็มหรือเท่ากับทศนิยมอยู่แล้ว ไม่ต้องเขียนซ้ำ
  if (e === decStr) return e;
  return `${e} ≈ ${decStr}`;
}
