import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

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
  appleWebApp: { capable: true, title: "Đoàn trường THPT Sơn Hà", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#0b63b8", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontSize: "14px" } }} />
      </body>
    </html>
  );
}
