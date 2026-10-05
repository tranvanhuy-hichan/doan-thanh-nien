"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Home, LogIn, Menu, Search, X } from "lucide-react";
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

const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
function Today() {
  const [text, setText] = useState("");
  useEffect(() => {
    const d = new Date(Date.now() + 7 * 3600_000); // giờ Việt Nam
    setText(`${WEEKDAYS[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`);
  }, []);
  return <span className="whitespace-nowrap">{text || " "}</span>;
}

function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form className={cn("flex overflow-hidden rounded border border-border bg-white", className)} onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`); }} role="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." aria-label="Tìm kiếm" className="min-w-0 flex-1 px-3 py-1.5 text-sm outline-none" />
      <button type="submit" className="bg-primary px-3 text-white hover:bg-primary-dark" aria-label="Tìm"><Search className="size-4" /></button>
    </form>
  );
}

export function SiteHeader({ address, bannerUrl }: { address: string; bannerUrl?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const main = MENU.filter((it) => !it.children); // Giới thiệu, Báo cáo Chi đoàn, Thi đua nằm ở thanh bên trái

  return (
    <header>
      {/* Banner lớn */}
      <div className="relative overflow-hidden bg-primary-dark text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 2px)", backgroundSize: "26px 26px" }}>
        <div className="flex min-h-36 items-center sm:min-h-52">
          <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3 px-4 py-4 sm:gap-6 lg:px-8">
            <Link href="/" className="shrink-0 rounded-full bg-white p-2 shadow-lg sm:p-3" aria-label="Trang chủ">
              <DoanLogo className="h-14 sm:h-24 lg:h-28" />
            </Link>
            <div className="min-w-0 leading-tight">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-blue-200 uppercase sm:text-sm">Đoàn TNCS Hồ Chí Minh</p>
              <h1 className="mt-1 text-lg font-extrabold tracking-wide text-[#ffd400] uppercase sm:text-2xl lg:text-3xl 2xl:text-4xl">Đoàn trường THPT Sơn Hà</h1>
              <p className="mt-1.5 text-xs text-blue-100 italic sm:text-base">Địa chỉ: {address}</p>
            </div>
          </div>
          {/* Ảnh bên phải (chỉ màn hình lớn) */}
          <div className="relative hidden h-52 w-[36%] shrink-0 lg:block">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-white/5"><DoanLogo className="h-44 opacity-20" /></div>
            )}
          </div>
        </div>
      </div>

      {/* Thanh menu */}
      <div className="sticky top-0 z-40 shadow-md">
        <nav className="bg-[#073a70]" aria-label="Menu chính">
          <div className="flex w-full items-center px-2 lg:px-6">
            <button className="rounded-md p-2.5 text-white hover:bg-white/10 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Mở menu" aria-expanded={open}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <ul className="hidden items-stretch lg:flex">
              <li><Link href="/" aria-label="Trang chủ" className={cn("flex h-full items-center px-4 py-3.5 text-white hover:bg-white/10", pathname === "/" && "bg-white/15")}><Home className="size-5" /></Link></li>
              {main.filter((it) => it.href !== "/").map((it) => (
                <li key={it.label} className="group relative">
                  <Link href={it.href} className={cn("flex h-full items-center gap-1 px-4 py-3.5 text-sm font-semibold tracking-wide whitespace-nowrap text-white/90 uppercase hover:bg-white/10 hover:text-white", isActive(pathname, it.href) && "bg-white text-primary-dark hover:bg-white hover:text-primary-dark")}>
                    {it.label}{it.children && <ChevronDown className="size-3.5 opacity-70" />}
                  </Link>
                  {it.children && (
                    <ul className="invisible absolute left-0 z-10 min-w-52 border border-border bg-white py-1 text-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {it.children.map((c) => <li key={c.href}><Link href={c.href} className="block px-4 py-2 text-sm hover:bg-primary-light hover:text-primary-dark">{c.label}</Link></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <span className="ml-2 text-sm font-semibold text-white lg:hidden">Menu</span>
            <Link href="/login" className="ml-auto my-1.5 inline-flex h-9 shrink-0 items-center gap-1.5 rounded bg-[#ffd400] px-3.5 text-sm font-bold text-[#073a70] hover:bg-yellow-300">
              <LogIn className="size-4" />Đăng nhập
            </Link>
          </div>
          {open && (
            <ul className="max-h-[70vh] divide-y divide-white/10 overflow-y-auto border-t border-white/10 lg:hidden">
              {MENU.map((it) => (
                <li key={it.label}>
                  <Link href={it.href} className={cn("block px-4 py-3 text-sm font-semibold text-white uppercase", isActive(pathname, it.href) && "bg-white/15")}>{it.label}</Link>
                  {it.children && (
                    <ul className="bg-black/15 pb-1">
                      {it.children.map((c) => <li key={c.href}><Link href={c.href} className="block py-2 pr-4 pl-8 text-[13px] text-blue-100">{c.label}</Link></li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>

      {/* Hàng ngày – chào mừng – tìm kiếm */}
      <div className="border-b border-border bg-slate-100/90">
        <div className="flex w-full items-center gap-3 px-4 py-2 text-sm lg:px-8">
          <span className="text-xs font-semibold text-slate-600 sm:text-sm"><Today /></span>
          <span className="hidden flex-1 text-center text-base font-extrabold tracking-wide text-primary uppercase md:block">Chào mừng các bạn đến với website Đoàn trường THPT Sơn Hà</span>
          <SearchBox className="ml-auto w-44 sm:w-64" />
        </div>
      </div>
    </header>
  );
}
