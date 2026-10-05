"use client";
import type { Role } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Topbar, type NotificationItem } from "./topbar";
import { BottomNav } from "./bottom-nav";

export function AppShell({ role, user, roleLabel, notifications, unread, children }: {
  role: Role; user: { fullName: string; avatarUrl: string | null }; roleLabel: string;
  notifications: NotificationItem[]; unread: number; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar role={role} />
      <div className="md:pl-16 lg:pl-60">
        <Topbar user={user} roleLabel={roleLabel} notifications={notifications} unread={unread} />
        {/* Mobile chừa chỗ cho thanh điều hướng dưới + vùng an toàn của iOS */}
        <main className="min-h-[calc(100vh-3.5rem)] w-full px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 lg:px-8">{children}</main>
      </div>
      <BottomNav role={role} />
    </div>
  );
}
