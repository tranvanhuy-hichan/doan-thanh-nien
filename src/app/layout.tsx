import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { AppSplash, SPLASH_CSS } from "@/components/layout/app-splash";

// Ảnh khởi động iOS (portrait) theo từng cỡ máy: public/splash/<rộng>x<cao>@<tỉ lệ>.png (sinh bằng scripts/gen-splash.mjs)
const IOS_SPLASH: [number, number, number][] = [[430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2], [320, 568, 2], [834, 1194, 2], [1024, 1366, 2], [810, 1080, 2], [768, 1024, 2]];

export const metadata: Metadata = {
  title: { default: "Đoàn trường THPT Sơn Hà", template: "%s · Đoàn trường THPT Sơn Hà" },
  description: "Cổng thông tin Đoàn TNCS Hồ Chí Minh - Trường THPT Sơn Hà: tin tức, kế hoạch, sự kiện, lịch hoạt động, thi đua và hệ thống quản lý đoàn viên.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  applicationName: "Đoàn trường THPT Sơn Hà",
  openGraph: {
    type: "website", locale: "vi_VN", siteName: "Đoàn trường THPT Sơn Hà",
    title: "Đoàn trường THPT Sơn Hà", description: "Cổng thông tin Đoàn TNCS Hồ Chí Minh - Trường THPT Sơn Hà: tin tức, kế hoạch, sự kiện, lịch hoạt động, thi đua.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Huy hiệu Đoàn" }],
  },
  twitter: { card: "summary", title: "Đoàn trường THPT Sơn Hà", images: ["/icon-512.png"] },
  appleWebApp: {
    capable: true, title: "Đoàn trường THPT Sơn Hà", statusBarStyle: "default",
    startupImage: IOS_SPLASH.map(([w, h, r]) => ({ url: `/splash/${w}x${h}@${r}.png`, media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)` })),
  },
};

export const viewport: Viewport = { themeColor: "#0b63b8", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head><style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} /></head>
      <body className="font-sans antialiased">
        {/* Màn hình chờ khi mở app đã cài (chỉ hiện ở chế độ standalone); do React quản lý nên gỡ an toàn */}
        <AppSplash />
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontSize: "14px" } }} />
      </body>
    </html>
  );
}
