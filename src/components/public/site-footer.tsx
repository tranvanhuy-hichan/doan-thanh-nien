import Link from "next/link";
import { DoanLogo } from "@/components/layout/logo";

export function SiteFooter({ address, phone, email }: { address: string; phone: string; email: string }) {
  return (
    <footer className="mt-12 bg-primary-dark text-blue-100">
      <div className="grid w-full gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        <div className="flex items-start gap-3">
          <DoanLogo className="h-14 shrink-0 drop-shadow-lg" />
          <div className="text-sm">
            <div className="font-semibold text-white uppercase">Đoàn trường THPT Sơn Hà</div>
            <div>Đoàn TNCS Hồ Chí Minh</div>
            <div className="text-blue-200">{address}</div>
            {phone && <div className="text-blue-200">ĐT: {phone}</div>}
            {email && <div className="text-blue-200">Email: {email}</div>}
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          {[["Giới thiệu", "/gioi-thieu/doan-truong"], ["Tin tức", "/tin-tuc"], ["Sự kiện", "/su-kien"], ["Kế hoạch", "/ke-hoach"], ["Thông báo", "/thong-bao"], ["Lịch hoạt động", "/lich-hoat-dong"], ["Thi đua", "/thi-dua"], ["Báo cáo Chi đoàn", "/bao-cao-chi-doan"], ["Góp ý ẩn danh", "/gop-y"]].map(([l, h]) => (
            <li key={h}><Link href={h} className="hover:text-white hover:underline">{l}</Link></li>
          ))}
        </ul>
        <div className="text-sm sm:col-span-2 lg:col-span-1">
          <p className="mb-2 text-blue-200">Dành cho đoàn viên và cán bộ Đoàn:</p>
          <Link href="/login" className="inline-flex h-10 w-full items-center justify-center rounded-md bg-white px-4 sm:w-auto font-medium text-primary-dark hover:bg-blue-50">Đăng nhập hệ thống quản lý</Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-blue-200">© {new Date().getFullYear()} Đoàn trường THPT Sơn Hà</div>
    </footer>
  );
}
