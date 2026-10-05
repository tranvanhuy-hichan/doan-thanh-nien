import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/nav";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <AppShell
      role={user.role}
      user={{ fullName: user.fullName, avatarUrl: user.avatarUrl }}
      roleLabel={ROLE_LABEL[user.role]}
      unread={unread}
      notifications={items.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, read: !!n.readAt, createdAt: n.createdAt.toISOString() }))}
    >
      {children}
    </AppShell>
  );
}
