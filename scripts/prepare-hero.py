#!/usr/bin/env python3
"""
เตรียมภาพพื้นหลังหน้าแรกให้พร้อมขึ้นเว็บ

วิธีใช้:  python3 scripts/prepare-hero.py <ไฟล์ภาพต้นฉบับ>

รับภาพอะไรก็ได้ (jpg / png / webp) แล้วคายออกมาเป็น public/hero-{2400,1600,900}.webp
เหตุผลที่ต้องมีสามขนาด: มือถือไม่ควรโหลดภาพ 2400px มาแล้วย่อทิ้ง เปลืองเน็ตของผู้เรียนเปล่า ๆ
เบราว์เซอร์จะเลือกขนาดที่พอดีเองจาก srcset

ถ้าภาพต้นฉบับกว้างไม่ถึง 2400px สคริปต์จะไม่ขยาย เพราะการขยายทำให้ภาพเบลอ
"""
import sys, os
from PIL import Image

SIZES = [2400, 1600, 900]
QUALITY = 82  # 82 คือจุดที่ตาแทบแยกไม่ออกจาก 100 แต่ไฟล์เล็กลงราวสี่เท่า

def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    src = sys.argv[1]
    if not os.path.exists(src):
        print(f"ไม่พบไฟล์: {src}")
        return 1

    im = Image.open(src).convert("RGB")
    w, h = im.size
    print(f"ต้นฉบับ {w}×{h}")
    if w < 1600:
        print("! ภาพกว้างน้อยกว่า 1600px — บนจอใหญ่จะเห็นว่าไม่คม ควรหาภาพที่ใหญ่กว่านี้")

    os.makedirs("public", exist_ok=True)
    for target in SIZES:
        if target > w:
            print(f"ข้าม {target}px (ต้นฉบับเล็กกว่า จะขยายแล้วเบลอ)")
            continue
        out = im.resize((target, round(h * target / w)), Image.LANCZOS)
        path = f"public/hero-{target}.webp"
        out.save(path, "WEBP", quality=QUALITY, method=6)
        print(f"  {path}  {out.size[0]}×{out.size[1]}  {os.path.getsize(path)//1024} KB")

    print("\nเสร็จแล้ว — หน้าแรกจะหยิบไปใช้เองอัตโนมัติ ไม่ต้องแก้โค้ด")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
