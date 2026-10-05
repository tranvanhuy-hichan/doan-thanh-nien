import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Đoàn TNCS Hồ Chí Minh - THPT Sơn Hà", template: "%s · Đoàn THPT Sơn Hà" },
  description: "Hệ thống quản lý đoàn viên và hoạt động Đoàn - Trường THPT Sơn Hà",
};

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
