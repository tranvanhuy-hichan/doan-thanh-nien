import Link from "next/link";
import { CompactList } from "@/components/ui/compact-list";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { activityScope, categories } from "@/lib/services/queries";
import { activityStatus } from "@/lib/services/activity-status";
import { formatDateTime, monthParamRange, pageParam, str } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { DataTable, EmptyState, PageHeader, Pagination, Td, Th } from "@/components/ui/misc";
import { FilterBar } from "@/components/ui/filter-bar";
import { ActivityStatusBadge } from "@/components/activities/status-badge";

export const metadata = { title: "Hoạt động" };
const PAGE_SIZE = 12;

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = str(sp.q), cat = str(sp.cat), status = str(sp.status), month = str(sp.month);
  const page = pageParam(sp.page);
  const now = new Date();

  const statusWhere: Prisma.ActivityWhereInput =
    status === "UPCOMING" ? { cancelledAt: null, startAt: { gt: now } }
    : status === "ONGOING" ? { cancelledAt: null, startAt: { lte: now }, endAt: { gte: now } }
    : status === "ENDED" ? { cancelledAt: null, endAt: { lt: now } }
    : status === "CANCELLED" ? { cancelledAt: { not: null } } : {};
  const range = monthParamRange(month);
  const monthWhere: Prisma.ActivityWhereInput = range ? { startAt: { gte: range.from, lt: range.to } } : {};
  const where: Prisma.ActivityWhereInput = {
    AND: [activityScope(user), statusWhere, monthWhere, q ? { title: { contains: q, mode: "insensitive" } } : {}, cat ? { categoryId: cat } : {}],
  };
  const [activities, total, cats] = await Promise.all([
    db.activity.findMany({
      where, orderBy: { startAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { category: true, department: true, _count: { select: { attendances: true, registrations: { where: { status: "REGISTERED" } } } } },
    }),
    db.activity.count({ where }),
    categories(),
  ]);
  const canCreate = user.role !== "MEMBER";

  return (
    <>
      <PageHeader title="Hoạt động Đoàn" actions={canCreate && <Link href="/activities/new" className={buttonClass()}><Plus className="size-4" />Tạo hoạt động</Link>} />
      <FilterBar fields={[
        { type: "search", name: "q", placeholder: "Tìm hoạt động..." },
        { type: "select", name: "cat", label: "Loại hoạt động", options: cats.map((c) => ({ value: c.id, label: c.name })) },
        { type: "select", name: "status", label: "Trạng thái", options: [
          { value: "UPCOMING", label: "Sắp diễn ra" }, { value: "ONGOING", label: "Đang diễn ra" }, { value: "ENDED", label: "Đã kết thúc" }, { value: "CANCELLED", label: "Đã hủy" }] },
        { type: "month", name: "month" },
      ]} />
      {activities.length === 0 ? (
        <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có hoạt động nào" description={canCreate ? "Tạo hoạt động đầu tiên để bắt đầu điểm danh." : "Các hoạt động mới sẽ xuất hiện tại đây."} /></div>
      ) : (
        <>
        <CompactList items={activities.map((a) => ({
          id: a.id, title: a.title, subtitle: `${formatDateTime(a.startAt)} · ${a.department?.name ?? "Toàn trường"}`,
          badge: <ActivityStatusBadge status={activityStatus(a, now)} />, href: `/activities/${a.id}`,
          details: [["Loại", a.category.name], ["Thời gian", formatDateTime(a.startAt)], ["Địa điểm", a.location], ["Tổ chức", a.department?.name ?? "Toàn trường"],
            ["Đăng ký", `${a._count.registrations}${a.maxParticipants ? ` / ${a.maxParticipants}` : ""}`], ["Tham gia", a._count.attendances], ["Điểm", a.points]],
        }))} />
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Hoạt động</Th><Th>Thời gian</Th><Th>Địa điểm</Th><Th>Tổ chức</Th><Th className="text-right">Đăng ký</Th><Th className="text-right">Tham gia</Th><Th>Trạng thái</Th></tr></thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <Td>
                  <Link href={`/activities/${a.id}`} className="font-medium hover:text-primary">{a.title}</Link>
                  <div className="text-xs text-muted">{a.category.name} · {a.points} điểm</div>
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(a.startAt)}</Td>
                <Td>{a.location}</Td>
                <Td>{a.department?.name ?? "Toàn trường"}</Td>
                <Td className="text-right tabular-nums">{a._count.registrations}{a.maxParticipants ? ` / ${a.maxParticipants}` : ""}</Td>
                <Td className="text-right tabular-nums">{a._count.attendances}</Td>
                <Td><ActivityStatusBadge status={activityStatus(a, now)} /></Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/activities" params={{ q, cat, status, month }} />
    </>
  );
}
