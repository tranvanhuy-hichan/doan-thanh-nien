"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Home, LayoutDashboard, LogIn, Mail, Menu, Phone, Search, X } from "lucide-react";
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
  { label: "Góp ý", href: "/gop-y" },
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

/** Liên kết ngoài hiển thị ở mục "Liên kết" (mở tab mới). */
const EXTERNAL_LINKS = [
  { label: "Trường THPT Sơn Hà", href: "https://c3sonha.quangngai.edu.vn/" },
  { label: "Sở GD&ĐT Quảng Ngãi", href: "https://quangngai.edu.vn/" },
  { label: "Bộ Giáo dục và Đào tạo", href: "https://moet.gov.vn/" },
  { label: "Trung ương Đoàn TNCS Hồ Chí Minh", href: "https://doanthanhnien.vn/" },
];

const isActive = (pathname: string, href: string) => {
  const base = href.split("?")[0];
  return base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(base + "/");
};

/** Đã đăng nhập chưa (hỏi nhẹ /api/me để trang công khai vẫn được cache). */
function useLoggedIn() {
  const [yes, setYes] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then((d) => alive && setYes(!!d.loggedIn)).catch(() => {});
    return () => { alive = false; };
  }, []);
  return yes;
}

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

export function SiteHeader({ bannerUrl, phone, email, facebook, youtube, marquee }: { address?: string; bannerUrl?: string; phone?: string; email?: string; facebook?: string; youtube?: string; marquee: { id: string; text: string; link: string | null }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Chỉ đóng menu khi thật sự chuyển trang (không đóng ngay sau khi vừa bấm mở)
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) { lastPath.current = pathname; setOpen(false); }
  }, [pathname]);
  const loggedIn = useLoggedIn();
  const main = MENU.filter((it) => !it.children); // Giới thiệu, Báo cáo Chi đoàn, Thi đua nằm ở thanh bên trái

  return (
    <header>
      {/* Thanh liên hệ */}
      {(phone || email || facebook || youtube) && (
        <div className="bg-[#0a4a94] text-white">
          <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-0.5 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm lg:px-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-0.5">
            {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:underline"><Phone className="size-3.5 text-[#ffd400]" />Hotline: {phone}</a>}
            {email && <a href={`mailto:${email}`} className="max-sm:hidden inline-flex items-center gap-1.5 hover:underline"><Mail className="size-3.5 text-[#ffd400]" />Email: {email}</a>}
            </div>
            <div className="flex items-center gap-4">
              {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">Facebook</a>}
              {youtube && <a href={youtube} target="_blank" rel="noopener noreferrer" className="hover:underline">Youtube</a>}
            </div>
          </div>
        </div>
      )}
      {/* Hàng thương hiệu: logo + tên | tìm kiếm | đăng nhập (thấp, gọn) */}
      <div className="border-b border-border bg-white">
        <div className="flex w-full items-center gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="Trang chủ">
            <DoanLogo className="h-12 shrink-0 sm:h-16" />
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 uppercase sm:text-[13px]">Đoàn TNCS Hồ Chí Minh</p>
              <h1 className="text-sm font-extrabold tracking-wide text-primary-dark uppercase sm:text-xl">Đoàn trường THPT Sơn Hà</h1>
            </div>
          </Link>
          <SearchBox className="mx-auto hidden w-full max-w-2xl lg:flex" />
          <Link href={loggedIn ? "/dashboard" : "/login"} className="ml-auto hidden h-10 shrink-0 items-center gap-1.5 rounded bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark lg:inline-flex lg:ml-0">
            {loggedIn ? <><LayoutDashboard className="size-4" />Trang quản lý</> : <><LogIn className="size-4" />Đăng nhập</>}
          </Link>
        </div>
      </div>

      {/* Thanh menu */}
      <div className="sticky top-0 z-40 shadow-md">
        <nav className="bg-[#073a70]" aria-label="Menu chính">
          <div className="flex w-full items-center px-1 lg:px-6">
            <button type="button" className="flex h-11 min-w-24 touch-manipulation items-center gap-3 rounded-md px-3 text-white hover:bg-white/10 active:bg-white/15 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Mở menu" aria-expanded={open}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
              <span className="text-sm font-semibold">Menu</span>
            </button>
            <ul className="hidden items-stretch lg:flex">
              <li><Link href="/" aria-label="Trang chủ" className={cn("flex h-full items-center px-4 py-2.5 text-white hover:bg-white/10", pathname === "/" && "bg-white/15")}><Home className="size-5" /></Link></li>
              {main.filter((it) => it.href !== "/").map((it) => (
                <li key={it.label} className="group relative">
                  <Link href={it.href} className={cn("flex h-full items-center gap-1 px-4 py-2.5 text-sm font-semibold tracking-wide whitespace-nowrap text-white/90 uppercase hover:bg-white/10 hover:text-white", isActive(pathname, it.href) && "bg-white text-primary-dark hover:bg-white hover:text-primary-dark")}>
                    {it.label}{it.children && <ChevronDown className="size-3.5 opacity-70" />}
                  </Link>
                  {it.children && (
                    <ul className="invisible absolute left-0 z-10 min-w-52 border border-border bg-white py-1 text-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {it.children.map((c) => <li key={c.href}><Link href={c.href} className="block px-4 py-2 text-sm hover:bg-primary-light hover:text-primary-dark">{c.label}</Link></li>)}
                    </ul>
                  )}
                </li>
              ))}
              <li className="group relative">
                <button type="button" className="flex h-full items-center gap-1 px-4 py-2.5 text-sm font-semibold tracking-wide whitespace-nowrap text-white/90 uppercase hover:bg-white/10 hover:text-white focus:bg-white/10" aria-haspopup="menu">
                  Liên kết<ChevronDown className="size-3.5 opacity-70" />
                </button>
                <ul className="invisible absolute left-0 z-10 min-w-72 border border-border bg-white py-1 text-foreground opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {EXTERNAL_LINKS.map((c) => <li key={c.href}><a href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-primary-light hover:text-primary-dark">{c.label}<ExternalLink className="size-3.5 opacity-50" /></a></li>)}
                </ul>
              </li>
            </ul>
            <Link href={loggedIn ? "/dashboard" : "/login"} aria-label={loggedIn ? "Trang quản lý" : "Đăng nhập"} className="ml-auto my-1.5 mr-1 inline-flex h-9 shrink-0 lg:hidden items-center gap-1.5 rounded bg-[#ffd400] px-3 text-sm max-sm:w-10 max-sm:justify-center max-sm:px-0 sm:px-3.5 font-bold text-[#073a70] hover:bg-yellow-300">
              {loggedIn ? <LayoutDashboard className="size-4" /> : <LogIn className="size-4" />}<span className="max-sm:hidden">{loggedIn ? "Trang quản lý" : "Đăng nhập"}</span>
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
              <li>
                <div className="px-4 py-3 text-sm font-semibold text-white uppercase">Liên kết</div>
                <ul className="bg-black/15 pb-1">
                  {EXTERNAL_LINKS.map((c) => <li key={c.href}><a href={c.href} target="_blank" rel="noopener noreferrer" className="block py-2 pr-4 pl-8 text-[13px] text-blue-100">{c.label}</a></li>)}
                </ul>
              </li>
            </ul>
          )}
        </nav>
      </div>

      {/* Banner full chiều ngang (chỉ trang chủ) */}
      {pathname === "/" && (
        <div className={cn("relative h-28 w-full overflow-hidden bg-primary-dark sm:h-40 lg:h-52", !bannerUrl && "max-sm:hidden")}>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="Banner Đoàn trường THPT Sơn Hà" className="size-full object-cover object-center" />
          ) : (
            <div className="relative flex size-full items-center justify-center gap-4 bg-gradient-to-r from-primary-dark via-primary to-primary-dark px-4 text-center text-white" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 2px)", backgroundSize: "26px 26px" }}>
              {/* Trang trí hai bên: sóng cờ và ngôi sao */}
              {(["left", "right"] as const).map((side) => (
                <div key={side} aria-hidden className={cn("pointer-events-none absolute inset-y-0 hidden w-1/4 overflow-hidden md:block lg:w-[30%]", side === "left" ? "left-0" : "right-0 -scale-x-100")} style={{ maskImage: "linear-gradient(to right, #000 45%, transparent)", WebkitMaskImage: "linear-gradient(to right, #000 45%, transparent)" }}>
                  <svg viewBox="0 0 300 208" preserveAspectRatio="none" className="absolute inset-0 size-full">
                    <path d="M0 150 C 60 110, 120 190, 190 140 S 280 120, 300 130 V208 H0Z" fill="#ffffff" fillOpacity="0.07" />
                    <path d="M0 175 C 70 140, 130 205, 200 165 S 280 150, 300 160 V208 H0Z" fill="#ffd400" fillOpacity="0.12" />
                    <path d="M0 40 L 120 0 H 0Z" fill="#ffd400" fillOpacity="0.14" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="absolute top-6 right-10 size-5 text-[#ffd400]/60" fill="currentColor"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z" /></svg>
                  <svg viewBox="0 0 24 24" className="absolute right-24 bottom-8 size-3 text-white/50" fill="currentColor"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z" /></svg>
                </div>
              ))}
              <DoanLogo className="relative h-16 drop-shadow-lg sm:h-28 lg:h-36" />
              <div className="relative text-left leading-tight"><p className="text-xs font-bold tracking-[0.18em] text-white uppercase sm:text-xl lg:text-2xl">Cổng thông tin điện tử</p><p className="mt-1 text-lg font-extrabold tracking-wide text-[#ffd400] uppercase sm:text-3xl lg:text-5xl">Đoàn trường THPT Sơn Hà</p><p className="mt-1.5 text-[11px] font-semibold tracking-[0.2em] text-blue-200 uppercase sm:text-sm">Đoàn TNCS Hồ Chí Minh</p></div>
            </div>
          )}
        </div>
      )}

      {/* Hàng ngày – dòng chữ chạy – tìm kiếm */}
      <div className="border-b border-border bg-slate-100/90">
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-sm sm:px-4 lg:flex-nowrap lg:px-8">
          <span className="text-xs font-semibold text-slate-600 sm:text-sm"><Today /></span>
          <Marquee items={marquee} className="order-last w-full lg:order-none lg:w-auto lg:flex-1" />
          <SearchBox className="ml-auto min-w-0 flex-1 sm:w-64 sm:flex-none lg:hidden" />
        </div>
      </div>
    </header>
  );
}

/** Chữ chạy ngang; rê chuột để dừng. Người dùng bật "giảm chuyển động" thì hiện đứng yên. */
function Marquee({ items, className }: { items: { id: string; text: string; link: string | null }[]; className?: string }) {
  const chars = items.reduce((n, i) => n + i.text.length + 6, 0);
  const content = items.map((it, i) => {
    const node = it.link ? <Link href={it.link} className="hover:underline">{it.text}</Link> : <span>{it.text}</span>;
    return <span key={it.id} className="inline-flex items-center">{i > 0 && <span className="mx-6 text-[#e0a800]" aria-hidden>★</span>}{node}</span>;
  });
  return (
    <div className={cn("marquee text-sm font-extrabold tracking-wide text-primary uppercase sm:text-base", className)} role="marquee" aria-label="Thông điệp">
      <div className="marquee-track" style={{ animationDuration: `${Math.max(14, chars * 0.16)}s` }}>{content}</div>
    </div>
  );
}
