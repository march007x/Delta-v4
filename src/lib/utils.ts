import { exact } from "@/lib/math/exact";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** ปัดเลขให้อ่านง่ายบนหน้าจอ โดยไม่ทิ้งความหมายของค่าที่เล็กมาก */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) < 1e-10) return "0";
  const r = Number(n.toFixed(digits));
  return Object.is(r, -0) ? "0" : String(r);
}

/**
 * แสดงค่าที่แน่นอนถ้าเขียนสั้นพอ (เช่น 3/2, √3/2) มิฉะนั้นแสดงทศนิยม
 * ใช้กับช่องค่าที่มีที่ว่างจำกัด เช่น ป้ายบนกราฟและตารางด้านข้าง
 */
export function fmtExact(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const e = exact(n);
  if (e && e.length <= 9) return e;
  return fmt(n, digits);
}
