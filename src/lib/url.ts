/**
 * ที่อยู่หลักของเว็บ ใช้ร่วมกันทั้ง sitemap, robots และลิงก์รูปสำหรับแชร์
 * ตั้งค่าได้ที่ตัวแปรแวดล้อม NEXT_PUBLIC_SITE_URL (ดู .env.example)
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
