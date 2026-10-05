import Link from "next/link";
import { CompactList } from "@/components/ui/compact-list";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { categories } from "@/lib/services/queries";
import { formatDate, formatDateTime, pageParam, str } from "@/utils";
import { DataTable, EmptyState, PageHeader, Pagination, StatusBadge, Td, Th, type Tone } from "@/components/ui/misc";
import { FilterBar } from "@/components/ui/filter-bar";

export const metadata = { title: "Lịch sử hoạt động" };
const PAGE_SIZE = 12;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  if (!user.memberId) redirect("/dashboard");
  const sp = await searchParams;
  const month = str(sp.month), cat = str(sp.cat), status = str(sp.status);
  const now = new Date();
  const page = pageParam(sp.page);

  const [attendances, registrations, cats] = await Promise.all([
    db.attendance.findMany({ where: { memberId: user.memberId }, include: { activity: { include: { category: true } }, point: true } }),
    db.activityRegistration.findMany({ where: { memberId: user.memberId, status: "REGISTERED" }, include: { activity: { include: { category: true } } } }),
    categories(),
  ]);
  const attendedIds = new Set(attendances.map((a) => a.activityId));

  type Row = { id: string; title: string; category: string; categoryId: string; startAt: Date; label: string; tone: Tone; key: string; points: number; checkedInAt?: Date };
  const rows: Row[] = [
    ...attendances.map((a) => ({ id: a.activityId, title: a.activity.title, category: a.activity.category.name, categoryId: a.activity.categoryId, startAt: a.activity.startAt, label: "Tham gia", key: "ATTENDED", tone: "green" as Tone, points: a.point?.points ?? 0, checkedInAt: a.checkedInAt })),
    ...registrations.filter((r) => !attendedIds.has(r.activityId) && !r.activity.cancelledAt).map((r) => {
      const ended = r.activity.endAt < now;
      return { id: r.activityId, title: r.activity.title, category: r.activity.category.name, categoryId: r.activity.categoryId, startAt: r.activity.startAt,
        label: ended ? "Vắng mặt" : "Đã đăng ký", key: ended ? "ABSENT" : "REGISTERED", tone: (ended ? "red" : "blue") as Tone, points: 0 };
    }),
  ].filter((r) => (!cat || r.categoryId === cat) && (!status || r.key === status) && (!month || formatMonth(r.startAt) === month))
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());

  return (
    <>
      <PageHeader title="Lịch sử hoạt động" />
      <FilterBar fields={[
        { type: "month", name: "month" },
        { type: "select", name: "cat", label: "Loại hoạt động", options: cats.map((c) => ({ value: c.id, label: c.name })) },
        { type: "select", name: "status", label: "Trạng thái", options: [{ value: "ATTENDED", label: "Tham gia" }, { value: "REGISTERED", label: "Đã đăng ký" }, { value: "ABSENT", label: "Vắng mặt" }] },
      ]} />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-white"><EmptyState title="Chưa có hoạt động nào" description="Lịch sử sẽ xuất hiện sau khi bạn đăng ký hoặc điểm danh hoạt động." /></div>
      ) : (
        <>
        <CompactList items={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => ({
          id: r.id + r.key, title: r.title, subtitle: formatDate(r.checkedInAt ?? r.startAt), badge: <StatusBadge tone={r.tone}>{r.label}</StatusBadge>, value: r.points ? `+${r.points}` : undefined,
          href: `/activities/${r.id}`, details: [["Loại", r.category], ["Thời gian", r.checkedInAt ? formatDateTime(r.checkedInAt) : formatDate(r.startAt)], ["Trạng thái", r.label], ["Điểm", r.points ? `+${r.points}` : "—"]],
        }))} />
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Hoạt động</Th><Th>Loại</Th><Th>Thời gian</Th><Th>Trạng thái</Th><Th className="text-right">Điểm</Th></tr></thead>
          <tbody>{rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
            <tr key={r.id + r.key} className="hover:bg-slate-50">
              <Td><Link href={`/activities/${r.id}`} className="font-medium hover:text-primary">{r.title}</Link></Td>
              <Td>{r.category}</Td>
              <Td className="whitespace-nowrap">{r.checkedInAt ? formatDateTime(r.checkedInAt) : formatDate(r.startAt)}</Td>
              <Td><StatusBadge tone={r.tone}>{r.label}</StatusBadge></Td>
              <Td className="text-right tabular-nums">{r.points ? `+${r.points}` : "—"}</Td>
            </tr>
          ))}</tbody>
        </DataTable>
        </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} basePath="/history" params={{ month, cat, status }} />
    </>
  );
}

function formatMonth(d: Date) {
  const s = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(d);
  return s.slice(0, 7);
}
