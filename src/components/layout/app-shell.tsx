"use client";
import type { Role } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { Topbar, type NotificationItem } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { NotificationProvider } from "@/components/notifications/notification-center";

export function AppShell({ role, user, roleLabel, notifications, unread, pushKey, badges, children }: {
  role: Role; user: { fullName: string; avatarUrl: string | null }; roleLabel: string;
  notifications: NotificationItem[]; unread: number; pushKey: string | null; badges?: Record<string, number>; children: React.ReactNode;
}) {
  return (
    <NotificationProvider publicKey={pushKey} latestId={notifications[0]?.id ?? null}>
    <div className="min-h-screen">
      <Sidebar role={role} badges={badges} />
      <div className="md:pl-16 lg:pl-60">
        <Topbar user={user} roleLabel={roleLabel} notifications={notifications} unread={unread} />
        {/* Mobile chừa chỗ cho thanh điều hướng dưới + vùng an toàn của iOS */}
        <main className="min-h-[calc(100vh-3.5rem)] w-full px-1.5 py-2.5 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-2.5 lg:px-3">{children}</main>
      </div>
      <BottomNav role={role} />
    </div>
    </NotificationProvider>
  );
}
