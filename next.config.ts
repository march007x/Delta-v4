import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ลินต์ถูกรันแยกใน CI (`npm run lint`) เพื่อไม่ให้ build ช้าและไม่ให้ warning บล็อกการ deploy
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
