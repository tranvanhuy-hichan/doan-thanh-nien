"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, ChevronDown, FileText, Trophy } from "lucide-react";
import { cn } from "@/utils";

export type SidebarDept = { id: string; name: string };
export type SidebarGrade = { grade: string; depts: SidebarDept[] };

const INTRO = [
  { label: "Đoàn trường", href: "/gioi-thieu/doan-truong" },
  { label: "BCH Đoàn trường", href: "/gioi-thieu/bch-doan-truong" },
  { label: "Cơ cấu tổ chức", href: "/gioi-thieu/co-cau-to-chuc" },
  { label: "Nội quy", href: "/gioi-thieu/noi-quy" },
];
const EMULATION = [
  { label: "Bảng thi đua tháng", href: "/thi-dua" },
  { label: "Thành tích", href: "/thi-dua/thanh-tich" },
  { label: "Chi đoàn tiêu biểu", href: "/thi-dua/chi-doan-tieu-bieu" },
];

function Group({ title, icon: Icon, open, children }: { title: string; icon: typeof BookOpen; open: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-border last:border-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold tracking-wide text-primary-dark uppercase hover:bg-primary-light [&::-webkit-details-marker]:hidden">
        <Icon className="size-4" />{title}<ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}

const itemClass = (active: boolean) => cn("block py-1.5 pr-3 pl-10 text-sm hover:bg-primary-light hover:text-primary-dark", active && "bg-primary-light font-semibold text-primary-dark");

/** Thanh bên trái của trang công khai: Giới thiệu / Báo cáo Chi đoàn (Khối → lớp) / Thi đua. */
export function PublicSidebar({ grades }: { grades: SidebarGrade[] }) {
  const pathname = usePathname();
  const khoi = useSearchParams().get("khoi");
  const inReports = pathname.startsWith("/bao-cao-chi-doan");
  return (
    <nav aria-label="Danh mục" className="overflow-hidden rounded-lg border border-border bg-white/85">
      <Group title="Giới thiệu" icon={BookOpen} open={pathname.startsWith("/gioi-thieu") || pathname === "/"}>
        {INTRO.map((i) => <Link key={i.href} href={i.href} className={itemClass(pathname === i.href)}>{i.label}</Link>)}
      </Group>
      <Group title="Báo cáo Chi đoàn" icon={FileText} open={inReports || pathname === "/"}>
        {grades.length === 0 && <p className="px-10 py-1.5 text-sm text-muted">Chưa có Chi đoàn</p>}
        {grades.map((g) => (
          <details key={g.grade} open={inReports && (khoi === g.grade || g.depts.some((d) => pathname.includes(d.id)))} className="group/sub">
            <summary className="flex cursor-pointer list-none items-center gap-1 py-1.5 pr-3 pl-8 text-sm font-semibold hover:bg-primary-light [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-3.5 -rotate-90 transition-transform group-open/sub:rotate-0" />Khối {g.grade}
            </summary>
            <div className="grid grid-cols-3 gap-1 pr-3 pb-1.5 pl-12">
              {g.depts.map((d) => (
                <Link key={d.id} href={`/bao-cao-chi-doan/${d.id}`} className={cn("rounded px-1.5 py-1 text-center text-[13px] hover:bg-primary-light hover:text-primary-dark", pathname.includes(d.id) && "bg-primary text-white hover:bg-primary hover:text-white")}>{d.name}</Link>
              ))}
            </div>
          </details>
        ))}
      </Group>
      <Group title="Thi đua" icon={Trophy} open={pathname.startsWith("/thi-dua") || pathname === "/"}>
        {EMULATION.map((i) => <Link key={i.href} href={i.href} className={itemClass(pathname === i.href)}>{i.label}</Link>)}
      </Group>
    </nav>
  );
}
