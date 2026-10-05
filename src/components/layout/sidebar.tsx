"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/utils";
import { navFor, type NavItem } from "@/lib/nav";
import { logoutAction } from "@/actions/auth";
import { DoanLogo } from "./logo";

function NavLinks({ items, labels, onNavigate }: { items: NavItem[]; labels: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  const link = (it: NavItem) => (
    <Link key={it.href} href={it.href} onClick={onNavigate} title={it.label}
      className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active(it.href) ? "bg-white font-medium text-primary-dark" : "text-blue-50 hover:bg-white/10")}>
      <it.icon className="size-[18px] shrink-0" />
      <span className={labels}>{it.label}</span>
    </Link>
  );
  return <>{items.map(link)}</>;
}

function SidebarBody({ items, labels, onNavigate }: { items: NavItem[]; labels: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/15 px-4 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white"><DoanLogo className="h-8" /></span>
        <div className={cn("min-w-0 leading-tight", labels)}>
          <div className="text-[13px] font-semibold text-white">Trường THPT Sơn Hà</div>
          <div className="text-xs text-blue-100">Đoàn TNCS Hồ Chí Minh</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Điều hướng chính">
        <NavLinks items={items} labels={labels} onNavigate={onNavigate} />
      </nav>
      <div className="space-y-0.5 border-t border-white/15 p-3">
        <NavLinks items={[{ href: "/settings", label: "Cài đặt", icon: Settings }]} labels={labels} onNavigate={onNavigate} />
        <form action={logoutAction}>
          <button type="submit" title="Đăng xuất" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-blue-50 hover:bg-white/10">
            <LogOut className="size-[18px] shrink-0" /><span className={labels}>Đăng xuất</span>
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar({ role }: { role: Role }) {
  // Tablet: thu gọn còn icon. Desktop: đầy đủ. Mobile dùng BottomNav nên không có thanh bên.
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-16 flex-col bg-primary-dark md:flex lg:w-60">
      <SidebarBody items={navFor(role)} labels="hidden lg:inline" />
    </aside>
  );
}
