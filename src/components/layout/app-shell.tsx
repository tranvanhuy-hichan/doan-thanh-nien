"use client";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { navFor } from "@/lib/nav";
import { Sidebar } from "./sidebar";
import { Topbar, type NotificationItem } from "./topbar";

export function AppShell({ role, user, roleLabel, notifications, unread, children }: {
  role: Role; user: { fullName: string; avatarUrl: string | null }; roleLabel: string;
  notifications: NotificationItem[]; unread: number; children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar items={navFor(role)} drawerOpen={drawer} onClose={() => setDrawer(false)} />
      <div className="md:pl-16 lg:pl-60">
        <Topbar user={user} roleLabel={roleLabel} notifications={notifications} unread={unread} onMenu={() => setDrawer(true)} />
        <main className="min-h-[calc(100vh-3.5rem)] w-full px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
