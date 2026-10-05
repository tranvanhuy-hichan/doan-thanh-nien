import Link from "next/link";
import { DoanLogo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-primary-dark text-blue-100">
      <div className="grid w-full gap-6 px-4 py-8 md:grid-cols-3 lg:px-8">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white"><DoanLogo className="h-9" /></span>
          <div className="text-sm">
            <div className="font-semibold text-white uppercase">Đoàn trường THPT Sơn Hà</div>
            <div>Đoàn TNCS Hồ Chí Minh</div>
            <div className="text-blue-200">Xã Sơn Hà, Tỉnh Quảng Ngãi</div>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-1 text-sm">
          {[["Giới thiệu", "/gioi-thieu/doan-truong"], ["Tin tức", "/tin-tuc"], ["Sự kiện", "/su-kien"], ["Kế hoạch", "/ke-hoach"], ["Thông báo", "/thong-bao"], ["Lịch hoạt động", "/lich-hoat-dong"], ["Thi đua", "/thi-dua"], ["Báo cáo Chi đoàn", "/bao-cao-chi-doan"]].map(([l, h]) => (
            <li key={h}><Link href={h} className="hover:text-white hover:underline">{l}</Link></li>
          ))}
        </ul>
        <div className="text-sm">
          <p className="mb-2 text-blue-200">Dành cho đoàn viên và cán bộ Đoàn:</p>
          <Link href="/login" className="inline-flex h-9 items-center rounded-md bg-white px-4 font-medium text-primary-dark hover:bg-blue-50">Đăng nhập hệ thống quản lý</Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-blue-200">© {new Date().getFullYear()} Đoàn trường THPT Sơn Hà</div>
    </footer>
  );
}
