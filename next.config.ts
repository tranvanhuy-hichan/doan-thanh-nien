import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "exceljs"],
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  experimental: { serverActions: { bodySizeLimit: "6mb" }, optimizePackageImports: ["lucide-react", "recharts"] },
  async headers() {
    return [{ source: "/logo-doan.webp", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] }];
  },
};

export default nextConfig;
