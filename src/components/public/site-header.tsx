"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Home, LayoutDashboard, LogIn, Mail, MapPin, Menu, Phone, Search, X } from "lucide-react";
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
  { label: "Lịch công tác", href: "/lich-cong-tac" },
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
  { label: "Tỉnh Đoàn Quảng Ngãi", href: "https://tinhdoan.quangngai.gov.vn/" },
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

function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form className={cn("flex overflow-hidden rounded border border-border bg-white", className)} onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`); }} role="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." aria-label="Tìm kiếm" autoFocus={autoFocus} className="min-w-0 flex-1 px-3 py-1.5 text-sm outline-none" />
      <button type="submit" className="bg-primary px-3 text-white hover:bg-primary-dark" aria-label="Tìm"><Search className="size-4" /></button>
    </form>
  );
}

/** Tranh nền banner mặc định: tia nắng, mây, trường học bên trái, nhà cao tầng + cờ bên phải, ngôi sao. */
function BannerArt() {
  const star = "M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z";
  return (
    <svg aria-hidden viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-0 size-full">
      {/* tia nắng toả từ giữa */}
      <g fill="#ffffff" opacity=".32">
        {Array.from({ length: 18 }, (_, i) => { const a = (-80 + i * 9.4) * Math.PI / 180; const w = 0.045; const r = 900; return <path key={i} d={`M800 250 L ${800 + r * Math.sin(a - w)} ${250 - r * Math.cos(a - w)} L ${800 + r * Math.sin(a + w)} ${250 - r * Math.cos(a + w)} Z`} />; })}
      </g>
      {/* mây */}
      <g fill="#fff" opacity=".85"><ellipse cx="300" cy="48" rx="150" ry="20" /><ellipse cx="400" cy="62" rx="100" ry="16" /><ellipse cx="1250" cy="40" rx="140" ry="19" /><ellipse cx="1360" cy="58" rx="90" ry="14" /><ellipse cx="800" cy="26" rx="110" ry="14" /></g>
      {/* đồi */}
      <path d="M0 240V196c120-26 260-30 400-8 120 18 220 22 330 10v42z" fill="#b7d6ef" opacity=".7" />
      <path d="M870 240v-40c120 14 260 12 380-6 120-18 240-12 350 14v32z" fill="#b7d6ef" opacity=".7" />
      {/* trường học (trái) */}
      <g>
        <path d="M120 240V132h300v108z" fill="#9cc3e6" />
        <path d="M100 132 L270 74 L440 132z" fill="#86b3dc" />
        <rect x="258" y="38" width="3" height="40" fill="#7aa8d4" /><path d="M261 40h42l-8 10 8 10h-42z" fill="#d9272e" /><path transform="translate(272 41) scale(.5)" d={star} fill="#ffd400" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={150 + i * 46} y={150} width="14" height="90" fill="#cfe3f5" />)}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={`w${i}`} x={138 + i * 42} y={140} width="10" height="8" fill="#eaf4fd" />)}
        <rect x="236" y="196" width="68" height="44" fill="#7aa8d4" />
        <path d="M30 240V176l60-14v78z" fill="#a9cbe8" /><path d="M450 240V170l70 14v56z" fill="#a9cbe8" />
        <circle cx="70" cy="214" r="22" fill="#9fd1b9" opacity=".8" /><circle cx="560" cy="218" r="18" fill="#9fd1b9" opacity=".8" />
      </g>
      {/* nhà cao tầng + cờ (phải) */}
      <g>
        <rect x="1120" y="86" width="86" height="154" fill="#9cc3e6" /><rect x="1206" y="126" width="120" height="114" fill="#b0cfec" /><rect x="1326" y="104" width="74" height="136" fill="#9cc3e6" />
        {[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => <rect key={`t${r}${c}`} x={1132 + c * 24} y={100 + r * 26} width="12" height="14" fill="#eaf4fd" />))}
        {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => <rect key={`u${r}${c}`} x={1216 + c * 22} y={140 + r * 24} width="11" height="12" fill="#eaf4fd" />))}
        {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`v${r}${c}`} x={1340 + c * 26} y={118 + r * 28} width="12" height="14" fill="#eaf4fd" />))}
        <rect x="1162" y="44" width="3" height="46" fill="#7aa8d4" /><path d="M1165 46h44l-8 10 8 10h-44z" fill="#d9272e" /><path transform="translate(1176 47) scale(.55)" d={star} fill="#ffd400" />
        <circle cx="1060" cy="218" r="20" fill="#9fd1b9" opacity=".8" /><circle cx="1420" cy="224" r="16" fill="#9fd1b9" opacity=".8" />
      </g>
      {/* ngôi sao */}
      <g fill="#ffd400" opacity=".9">{[[640, 30, .5], [980, 44, .45], [760, 190, .35], [90, 40, .4], [1560, 150, .4]].map(([x, y, k], i) => <path key={i} transform={`translate(${x} ${y}) scale(${k})`} d={star} />)}</g>
    </svg>
  );
}

export function SiteHeader({ address, bannerUrl, phone, email, facebook, youtube, marquee }: { address?: string; bannerUrl?: string; phone?: string; email?: string; facebook?: string; youtube?: string; marquee: { id: string; text: string; link: string | null }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // ô tìm kiếm trên điện thoại (bấm biểu tượng để mở)
  // Chỉ đóng menu khi thật sự chuyển trang (không đóng ngay sau khi vừa bấm mở)
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) { lastPath.current = pathname; setOpen(false); }
  }, [pathname]);
  const loggedIn = useLoggedIn();
  const main = MENU.filter((it) => !it.children); // Giới thiệu, Báo cáo Chi đoàn, Thi đua nằm ở thanh bên trái

  return (
    <header className="no-print contents">
      {/* Thanh liên hệ */}
      {(phone || email || facebook || youtube) && (
        <div className="bg-[#0a4a94] text-white max-lg:hidden">
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
      {/* Đầu trang trên điện thoại/máy tính bảng: MỘT thanh gọn kiểu ứng dụng (☰ + logo + tên | tìm kiếm | đăng nhập) */}
      <div className="sticky top-0 z-50 border-b border-border bg-white shadow-sm lg:hidden">
        <div className="flex h-14 items-center gap-1 px-2">
          <button type="button" onClick={() => { setOpen((o) => !o); setSearchOpen(false); }} aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open}
            className="flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-primary-dark hover:bg-primary-light active:bg-primary-light">
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2" aria-label="Trang chủ">
            <DoanLogo className="h-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-extrabold tracking-wide text-primary-dark uppercase">Đoàn trường THPT Sơn Hà</div>
              <div className="truncate text-[10px] font-medium tracking-wider text-slate-500 uppercase">Cổng thông tin điện tử</div>
            </div>
          </Link>
          <button type="button" onClick={() => { setSearchOpen((o) => !o); setOpen(false); }} aria-label="Tìm kiếm" aria-expanded={searchOpen}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-primary-dark hover:bg-primary-light active:bg-primary-light">
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>
          <Link href={loggedIn ? "/dashboard" : "/login"} aria-label={loggedIn ? "Trang quản lý" : "Đăng nhập"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark">
            {loggedIn ? <LayoutDashboard className="size-[18px]" /> : <LogIn className="size-[18px]" />}
          </Link>
        </div>
        {searchOpen && <div className="px-3 pb-3"><SearchBox className="w-full" autoFocus /></div>}
        {open && (
          <div className="fixed inset-x-0 top-14 bottom-0 z-50 overflow-y-auto bg-white pb-8">
            <ul className="divide-y divide-border">
              {MENU.map((it) => (
                <li key={it.label}>
                  <Link href={it.href} className={cn("flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold text-slate-800", isActive(pathname, it.href) && "bg-primary-light text-primary-dark")}>{it.label}<ChevronRight className="size-4 text-slate-400" /></Link>
                  {it.children && (
                    <ul className="bg-slate-50 pb-1.5">
                      {it.children.map((c) => <li key={c.href}><Link href={c.href} className="block py-2 pr-4 pl-8 text-sm text-slate-600">{c.label}</Link></li>)}
                    </ul>
                  )}
                </li>
              ))}
              <li>
                <div className="px-4 pt-3.5 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Liên kết</div>
                <ul className="pb-1.5">
                  {EXTERNAL_LINKS.map((c) => <li key={c.href}><a href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2.5 pr-4 pl-4 text-sm text-slate-700">{c.label}<ExternalLink className="size-3.5 text-slate-400" /></a></li>)}
                </ul>
              </li>
            </ul>
            {(phone || email || facebook || youtube) && (
              <div className="mt-2 space-y-2 border-t border-border px-4 pt-4 text-sm text-slate-700">
                {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2"><Phone className="size-4 text-primary" />Hotline: {phone}</a>}
                {email && <a href={`mailto:${email}`} className="flex items-center gap-2"><Mail className="size-4 text-primary" />{email}</a>}
                {address && <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0 text-primary" />{address}</p>}
                {(facebook || youtube) && <div className="flex gap-4 pt-1 text-primary">{facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" className="font-medium">Facebook</a>}{youtube && <a href={youtube} target="_blank" rel="noopener noreferrer" className="font-medium">Youtube</a>}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hàng thương hiệu: logo + tên | tìm kiếm | đăng nhập (thấp, gọn) */}
      <div className="border-b border-border bg-white max-lg:hidden">
        <div className="flex w-full items-center gap-4 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="Trang chủ">
            <DoanLogo className="h-11 shrink-0 sm:h-14" />
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 uppercase sm:text-[13px]">Đoàn TNCS Hồ Chí Minh</p>
              <h1 className="text-sm font-extrabold tracking-wide text-primary-dark uppercase sm:text-xl">Đoàn trường THPT Sơn Hà</h1>
              {address && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 sm:text-xs"><MapPin className="size-3 shrink-0 text-primary" /><span className="truncate">{address}</span></p>}
            </div>
          </Link>
          <SearchBox className="ml-auto hidden w-full max-w-xl lg:flex" />
        </div>
      </div>

      {/* Thanh menu */}
      <div className="sticky top-0 z-40 shadow-md max-lg:hidden">
        <nav className="bg-[#073a70]" aria-label="Menu chính">
          <div className="flex w-full items-center px-1 lg:px-6">
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
            <Link href={loggedIn ? "/dashboard" : "/login"} className="ml-auto flex shrink-0 items-center px-3 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-white/90 uppercase hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm">
              {loggedIn ? "Trang quản lý" : "Đăng nhập"}
            </Link>
          </div>
        </nav>
      </div>

      {/* Banner full chiều ngang (chỉ trang chủ): ảnh Admin tải lên, hoặc banner mặc định nền trời xanh nhạt + toà nhà + khẩu hiệu */}
      {pathname === "/" && (
        <div className="relative w-full overflow-hidden border-b border-primary/15">
          {bannerUrl ? (
            <div className="h-28 sm:h-36 lg:h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="Banner Đoàn trường THPT Sơn Hà" className="size-full object-cover object-center" />
            </div>
          ) : (
            <div className="relative h-32 bg-gradient-to-b from-[#bcdcf7] via-[#dcecfa] to-[#f2f8fe] sm:h-40 lg:h-52">
              <BannerArt />

              {/* Hai bên: các dòng viết tay (từ màn hình lớn) */}
              <div className="pointer-events-none absolute top-1/2 left-[3%] hidden -translate-y-1/2 -rotate-3 font-script text-[#0a3d82] xl:block">
                <div className="text-4xl leading-tight 2xl:text-5xl">Tuổi trẻ</div>
                <div className="text-4xl leading-tight 2xl:text-5xl">Sơn Hà</div>
                <svg viewBox="0 0 220 14" className="mt-1 w-44 2xl:w-52"><path d="M4 10 C 50 3, 140 2, 216 8" fill="none" stroke="#ffd400" strokeWidth="5" strokeLinecap="round" /></svg>
              </div>
              <div className="pointer-events-none absolute top-1/2 right-[3%] hidden -translate-y-1/2 rotate-3 text-right font-script text-[#0a3d82] xl:block">
                {["Tiên phong", "Sáng tạo", "Phát triển"].map((t) => (
                  <div key={t} className="flex items-center justify-end gap-2 text-3xl leading-tight 2xl:text-4xl">
                    {t}<svg viewBox="0 0 24 24" className="size-4 text-[#ffd400]" fill="currentColor"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z" /></svg>
                  </div>
                ))}
              </div>

              {/* Giữa: huy hiệu + thông tin */}
              <div className="relative flex h-full items-center justify-center gap-3 px-4 sm:gap-5 lg:gap-7">
                <DoanLogo className="h-16 shrink-0 drop-shadow-md sm:h-24 lg:h-36" />
                <div className="min-w-0 leading-tight">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase sm:text-sm lg:text-lg">Cổng thông tin điện tử</p>
                  <h2 className="text-[17px] font-extrabold tracking-tight text-[#0a3d82] uppercase sm:text-3xl lg:text-5xl">Đoàn trường THPT Sơn Hà</h2>
                  <p className="mt-0.5 text-[9px] font-semibold tracking-[0.2em] text-primary uppercase sm:mt-1 sm:text-xs lg:text-base">Đoàn TNCS Hồ Chí Minh</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hàng ngày – dòng chữ chạy – tìm kiếm */}
      <div className="border-b border-border bg-slate-100/90">
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:flex-nowrap lg:px-8">
          <span className="text-xs font-semibold text-slate-600 max-sm:hidden sm:text-sm"><Today /></span>
          <Marquee items={marquee} className="order-last w-full sm:order-none sm:w-auto sm:flex-1" />
                  </div>
      </div>
    </header>
  );
}

/** Chữ chạy ngang; rê chuột để dừng. Người dùng bật "giảm chuyển động" thì hiện đứng yên. */
function Marquee({ items, className }: { items: { id: string; text: string; link: string | null }[]; className?: string }) {
  const chars = items.reduce((n, i) => n + i.text.length + 4, 0);
  // Nội dung được lặp đủ rộng (>= ~2000px) rồi nhân đôi, chạy -50% => các dòng chữ nối đuôi nhau liên tục, không có khoảng trống.
  const repeat = Math.max(1, Math.ceil(2000 / (chars * 11)));
  const set = items.map((it) => {
    const node = it.link ? <Link href={it.link} className="hover:underline">{it.text}</Link> : <span>{it.text}</span>;
    return <span key={it.id} className="inline-flex shrink-0 items-center">{node}<span className="mx-6 text-[#e0a800]" aria-hidden>★</span></span>;
  });
  const group = (k: number) => (
    <div key={k} className="inline-flex shrink-0 items-center" aria-hidden={k === 1}>
      {Array.from({ length: repeat }, (_, r) => <span key={r} className="inline-flex shrink-0 items-center">{set}</span>)}
    </div>
  );
  return (
    <div className={cn("marquee text-[13px] font-extrabold tracking-wide text-primary uppercase sm:text-base", className)} role="marquee" aria-label="Thông điệp">
      <div className="marquee-track" style={{ animationDuration: `${Math.max(20, chars * repeat * 0.2)}s` }}>{group(0)}{group(1)}</div>
    </div>
  );
}
