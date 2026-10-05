"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Grip, LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/utils";
import { mobileNav, type NavItem } from "@/lib/nav";
import { logoutAction } from "@/actions/auth";

const isActive = (pathname: string, it: NavItem) => { const h = it.match ?? it.href; return pathname === h || (h !== "/dashboard" && pathname.startsWith(h + "/")); };

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link href={item.href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px]", active ? "font-semibold text-primary" : "text-slate-500")} aria-current={active ? "page" : undefined}>
      <item.icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.8} />
      <span className="max-w-full truncate px-0.5">{item.label}</span>
    </Link>
  );
}

/** Thanh điều hướng dưới cho mobile: 2 mục — nút Thêm (giữa) — 2 mục. */
export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const { main, more } = mobileNav(role);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const moreActive = more.some((i) => isActive(pathname, i));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Chức năng khác">
            <div className="mx-auto my-2 h-1 w-10 rounded-full bg-slate-200" />
            <div className="grid grid-cols-3 gap-2 px-4 pt-2">
              {more.map((it) => (
                <Link key={it.href} href={it.href} className={cn("flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs", isActive(pathname, it) ? "bg-primary-light font-semibold text-primary-dark" : "bg-slate-50 text-slate-700 active:bg-slate-100")}>
                  <it.icon className="size-6" />{it.label}
                </Link>
              ))}
              <form action={logoutAction} className="contents">
                <button type="submit" className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-3 text-center text-xs text-danger active:bg-slate-100">
                  <LogOut className="size-6" />Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <nav className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Điều hướng nhanh">
        <div className="flex items-end px-1">
          <Tab item={main[0]} active={isActive(pathname, main[0])} />
          <Tab item={main[1]} active={isActive(pathname, main[1])} />
          <div className="flex flex-1 justify-center">
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Thêm chức năng"
              className={cn("-mt-4 mb-1 flex size-14 flex-col items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-md transition-colors active:bg-primary-dark", (open || moreActive) && "bg-primary-dark")}>
              <Grip className="size-6" />
            </button>
          </div>
          <Tab item={main[2]} active={isActive(pathname, main[2])} />
          <Tab item={main[3]} active={isActive(pathname, main[3])} />
        </div>
      </nav>
    </>
  );
}
