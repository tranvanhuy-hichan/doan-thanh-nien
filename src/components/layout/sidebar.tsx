"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, X } from "lucide-react";
import { cn } from "@/utils";
import type { NavItem } from "@/lib/nav";
import { logoutAction } from "@/actions/auth";
import { DoanLogo } from "./logo";

function NavLinks({ items, labels, onNavigate }: { items: NavItem[]; labels: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  const link = (it: NavItem) => (
    <Link key={it.href} href={it.href} onClick={onNavigate} title={it.label}
      className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active(it.href) ? "bg-primary-light font-medium text-primary-dark" : "text-slate-600 hover:bg-slate-100")}>
      <it.icon className="size-[18px] shrink-0" />
      <span className={labels}>{it.label}</span>
    </Link>
  );
  return <>{items.map(link)}</>;
}

function SidebarBody({ items, labels, onNavigate }: { items: NavItem[]; labels: string; onNavigate?: () => void }) {
  return (
    <>
      <div className={cn("flex items-center gap-3 border-b border-border px-4 py-4", "")}>
        <DoanLogo className="h-10 shrink-0" />
        <div className={cn("min-w-0 leading-tight", labels)}>
          <div className="text-[13px] font-semibold">Trường THPT Sơn Hà</div>
          <div className="text-xs text-muted">Đoàn TNCS Hồ Chí Minh</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Điều hướng chính">
        <NavLinks items={items} labels={labels} onNavigate={onNavigate} />
      </nav>
      <div className="space-y-0.5 border-t border-border p-3">
        <NavLinks items={[{ href: "/settings", label: "Cài đặt", icon: Settings }]} labels={labels} onNavigate={onNavigate} />
        <form action={logoutAction}>
          <button type="submit" title="Đăng xuất" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            <LogOut className="size-[18px] shrink-0" /><span className={labels}>Đăng xuất</span>
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar({ items, drawerOpen, onClose }: { items: NavItem[]; drawerOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Tablet: thu gọn còn icon. Desktop: đầy đủ. */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-border bg-white/85 md:flex lg:w-60">
        <SidebarBody items={items} labels="hidden lg:inline" />
      </aside>
      {/* Mobile: drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <button onClick={onClose} className="absolute top-3 right-3 rounded p-1 text-muted hover:bg-slate-100" aria-label="Đóng menu"><X className="size-4" /></button>
            <SidebarBody items={items} labels="inline" onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
