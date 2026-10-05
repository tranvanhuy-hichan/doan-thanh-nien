import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { canManageActivity } from "@/lib/permissions";
import { activityScope } from "@/lib/services/queries";
import { activityStatus } from "@/lib/services/activity-status";
import { formatDateTime } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { DataTable, EmptyState, PageHeader, StatusBadge, Td, Th } from "@/components/ui/misc";
import { ActivityStatusBadge } from "@/components/activities/status-badge";

export const metadata = { title: "Điểm danh" };

export default async function AttendanceIndexPage() {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const now = new Date();
  // Hoạt động đang diễn ra / sắp diễn ra trong 7 ngày / mới kết thúc trong 3 ngày
  const activities = await db.activity.findMany({
    where: { AND: [activityScope(user), { cancelledAt: null, endAt: { gte: new Date(now.getTime() - 3 * 86400_000) }, startAt: { lte: new Date(now.getTime() + 7 * 86400_000) } }] },
    orderBy: { startAt: "asc" },
    include: { department: true, _count: { select: { attendances: true } } },
  });
  return (
    <>
      <PageHeader title="Điểm danh" description="Hoạt động đang và sắp diễn ra. Chọn hoạt động để mở mã QR điểm danh." />
      {activities.length === 0 ? (
        <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Không có hoạt động cần điểm danh" description="Tạo hoạt động mới để bắt đầu." action={<Link href="/activities/new" className={buttonClass()}>Tạo hoạt động</Link>} /></div>
      ) : (
        <>
        <ul className="divide-y divide-border rounded-lg border border-border bg-white/85 sm:hidden">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.title}</div>
                <div className="truncate text-xs text-muted">{formatDateTime(a.startAt)} · {a.department?.name ?? "Toàn trường"}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <ActivityStatusBadge status={activityStatus(a, now)} />
                  <StatusBadge tone={a.checkinOpen ? "green" : "gray"}>{a.checkinOpen ? "Đang mở" : "Đóng"}</StatusBadge>
                  <span className="text-xs text-muted">{a._count.attendances} đã điểm danh</span>
                </div>
              </div>
              <Link href={canManageActivity(user, a) ? `/activities/${a.id}/attendance` : `/activities/${a.id}`} className={buttonClass(canManageActivity(user, a) ? "secondary" : "ghost", "sm")}>
                {canManageActivity(user, a) ? "Quản lý" : "Xem"}
              </Link>
            </li>
          ))}
        </ul>
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Hoạt động</Th><Th>Thời gian</Th><Th>Tổ chức</Th><Th className="text-right">Đã điểm danh</Th><Th>Trạng thái</Th><Th>Điểm danh</Th><Th /></tr></thead>
          <tbody>{activities.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <Td className="font-medium">{a.title}</Td><Td className="whitespace-nowrap">{formatDateTime(a.startAt)}</Td><Td>{a.department?.name ?? "Toàn trường"}</Td>
              <Td className="text-right tabular-nums">{a._count.attendances}</Td>
              <Td><ActivityStatusBadge status={activityStatus(a, now)} /></Td>
              <Td><StatusBadge tone={a.checkinOpen ? "green" : "gray"}>{a.checkinOpen ? "Đang mở" : "Đóng"}</StatusBadge></Td>
              <Td className="text-right">{canManageActivity(user, a)
                ? <Link href={`/activities/${a.id}/attendance`} className={buttonClass("secondary", "sm")}>Quản lý</Link>
                : <Link href={`/activities/${a.id}`} className={buttonClass("ghost", "sm")}>Xem</Link>}</Td>
            </tr>
          ))}</tbody>
        </DataTable>
        </div>
        </>
      )}
    </>
  );
}
