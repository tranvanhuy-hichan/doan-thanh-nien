"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogIn, Menu, X } from "lucide-react";
import { cn } from "@/utils";
import { DoanLogo } from "@/components/layout/logo";

type Item = { label: string; href: string; children?: { label: string; href: string }[] };

const MENU: Item[] = [
  { label: "Trang chủ", href: "/" },
  {
    label: "Giới thiệu", href: "/gioi-thieu/doan-truong",
    children: [
      { label: "Đoàn trường", href: "/gioi-thieu/doan-truong" },
      { label: "BCH Đoàn trường", href: "/gioi-thieu/bch-doan-truong" },
      { label: "Cơ cấu tổ chức", href: "/gioi-thieu/co-cau-to-chuc" },
      { label: "Nội quy", href: "/gioi-thieu/noi-quy" },
    ],
  },
  { label: "Kế hoạch", href: "/ke-hoach" },
  { label: "Sự kiện", href: "/su-kien" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Lịch hoạt động", href: "/lich-hoat-dong" },
  { label: "Thông báo", href: "/thong-bao" },
  {
    label: "Báo cáo Chi đoàn", href: "/bao-cao-chi-doan",
    children: [
      { label: "Khối 10", href: "/bao-cao-chi-doan?khoi=10" },
      { label: "Khối 11", href: "/bao-cao-chi-doan?khoi=11" },
      { label: "Khối 12", href: "/bao-cao-chi-doan?khoi=12" },
    ],
  },
  {
    label: "Thi đua", href: "/thi-dua",
    children: [
      { label: "Bảng thi đua tháng", href: "/thi-dua" },
      { label: "Thành tích", href: "/thi-dua/thanh-tich" },
      { label: "Chi đoàn tiêu biểu", href: "/thi-dua/chi-doan-tieu-bieu" },
    ],
  },
];

const isActive = (pathname: string, href: string) => {
  const base = href.split("?")[0];
  return base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(base + "/");
};

export function SiteHeader({ address }: { address: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="border-b border-border bg-white">
        <div className="flex w-full items-center gap-3 px-4 py-2.5 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <DoanLogo className="h-12 shrink-0 sm:h-14" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[10px] font-medium tracking-wide text-muted uppercase sm:text-xs">Đoàn TNCS Hồ Chí Minh</span>
              <span className="block text-[15px] leading-tight font-bold text-primary-dark uppercase sm:text-xl">Đoàn trường THPT Sơn Hà</span>
              <span className="hidden text-xs text-muted sm:block">{address}</span>
            </span>
          </Link>
          <Link href="/login" className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-white hover:bg-primary-dark">
            <LogIn className="size-4" /><span className="max-sm:hidden">Đăng nhập</span><span className="sm:hidden">Vào</span>
          </Link>
          <button className="rounded-md p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Mở menu" aria-expanded={open}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Desktop */}
      <nav className="hidden bg-primary-dark lg:block" aria-label="Menu chính">
        <ul className="flex w-full px-4 lg:px-8">
          {MENU.map((it) => (
            <li key={it.label} className="group relative">
              <Link href={it.href} className={cn("flex items-center gap-1 px-3 py-3 text-sm font-medium whitespace-nowrap text-white/90 hover:bg-white/10 hover:text-white", isActive(pathname, it.href) && "bg-white/15 text-white")}>
                {it.label}{it.children && <ChevronDown className="size-3.5 opacity-70" />}
              </Link>
              {it.children && (
                <ul className="invisible absolute left-0 z-10 min-w-52 rounded-b-md border border-border bg-white py-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {it.children.map((c) => <li key={c.href}><Link href={c.href} className="block px-4 py-2 text-sm hover:bg-primary-light hover:text-primary-dark">{c.label}</Link></li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile */}
      {open && (
        <nav className="max-h-[75vh] overflow-y-auto bg-primary-dark lg:hidden" aria-label="Menu chính">
          <ul className="divide-y divide-white/10">
            {MENU.map((it) => (
              <li key={it.label}>
                <Link href={it.href} className={cn("block px-4 py-3 text-sm font-medium text-white", isActive(pathname, it.href) && "bg-white/15")}>{it.label}</Link>
                {it.children && (
                  <ul className="bg-black/10 pb-1">
                    {it.children.map((c) => <li key={c.href}><Link href={c.href} className="block py-2 pr-4 pl-8 text-[13px] text-blue-100">{c.label}</Link></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
