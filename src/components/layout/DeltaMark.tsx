/* eslint-disable @next/next/no-img-element */

/**
 * โลโก้ Delta — ใช้ไฟล์ภาพจริงที่ผู้ออกแบบให้มา
 *
 * มีสองไฟล์เพราะโลโก้ต้นฉบับเป็นน้ำเงินกรมท่า ซึ่งจมหายไปบนพื้นเข้มของธีมมืด
 * จึงเตรียมรุ่นตัวสามเหลี่ยมสีขาวนวลไว้คู่กัน (เส้นเฉียงสีฟ้าคงเดิมทั้งสองรุ่น
 * เพราะมันคือส่วนที่ทำให้จำโลโก้ได้) แล้วสลับด้วย CSS ตามธีม
 * ทำเป็น <img> สองอันแทน JS เพื่อให้ได้ภาพถูกตัวตั้งแต่เฟรมแรก ไม่กะพริบตอนโหลด
 */

/** อัตราส่วนจริงของไฟล์ 642 × 554 — ใช้กำหนดความกว้างจากความสูงที่ขอมา */
const RATIO = 642 / 554;

export function DeltaMark({ size = 30, className }: { size?: number; className?: string }) {
  const w = Math.round(size * RATIO);
  return (
    <span
      className={className}
      style={{ display: "inline-block", width: w, height: size, flexShrink: 0 }}
    >
      <img
        src="/logo-mark.png"
        alt="Delta"
        width={w}
        height={size}
        className="logo-on-light"
        style={{ width: "100%", height: "100%" }}
      />
      <img
        src="/logo-mark-light.png"
        alt=""
        aria-hidden
        width={w}
        height={size}
        className="logo-on-dark"
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}

/** โลโก้เต็มพร้อมคำว่า DELTA — ใช้ตอนที่มีที่ว่างพอ เช่น หน้าแรกหรือท้ายเว็บ */
export function DeltaLockup({ height = 96, className }: { height?: number; className?: string }) {
  const w = Math.round(height * (794 / 748));
  return (
    <span
      className={className}
      style={{ display: "inline-block", width: w, height, flexShrink: 0 }}
    >
      <img
        src="/logo-lockup.png"
        alt="Delta"
        width={w}
        height={height}
        className="logo-on-light"
        style={{ width: "100%", height: "100%" }}
      />
      <img
        src="/logo-lockup-light.png"
        alt=""
        aria-hidden
        width={w}
        height={height}
        className="logo-on-dark"
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );
}
