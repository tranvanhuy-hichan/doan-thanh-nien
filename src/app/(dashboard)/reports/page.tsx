import Link from "next/link";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { activityReport } from "@/lib/services/reports";
import { departmentRanking } from "@/lib/services/stats";
import { formatDateTime, pageParam, str } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { DataTable, EmptyState, PageHeader, Pagination, Section, Stat, Td, Th } from "@/components/ui/misc";
import { FilterBar } from "@/components/ui/filter-bar";

export const metadata = { title: "Báo cáo" };
const PAGE_SIZE = 10;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const sp = await searchParams;
  const month = str(sp.month);
  const page = pageParam(sp.page);
  const [rows, ranking] = await Promise.all([activityReport(user, month), user.role === "ADMIN" ? departmentRanking() : Promise.resolve([])]);
  const attended = rows.reduce((s, r) => s + r._count.attendances, 0);
  const expected = rows.reduce((s, r) => s + r.expected, 0);
  const rate = expected ? Math.min(100, Math.round((attended / expected) * 100)) : 0;
  return (
    <>
      <PageHeader title="Báo cáo" description={user.role === "SECRETARY" ? `Chi đoàn ${user.departmentName}` : "Toàn trường"}
        actions={<a href={`/api/reports/export${month ? `?month=${month}` : ""}`} className={buttonClass("secondary")}><Download className="size-4" />Xuất Excel</a>} />
      <FilterBar fields={[{ type: "month", name: "month" }]} />
      <div className="grid grid-cols-3 gap-6 sm:max-w-xl">
        <Stat label="Hoạt động đã diễn ra" value={rows.length} />
        <Stat label="Lượt tham gia" value={attended} />
        <Stat label="Tỷ lệ tham gia" value={`${rate}%`} />
      </div>
      <Section title="Chi tiết theo hoạt động" className="mt-8">
        {rows.length === 0 ? <div className="rounded-lg border border-border bg-white"><EmptyState title="Không có hoạt động trong kỳ báo cáo" /></div> : (
          <DataTable>
            <thead><tr><Th>Hoạt động</Th><Th>Thời gian</Th><Th>Tổ chức</Th><Th className="text-right">Đăng ký</Th><Th className="text-right">Tham gia</Th><Th className="text-right">Tỷ lệ</Th></tr></thead>
            <tbody>{rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((a) => (
              <tr key={a.id}><Td><Link href={`/activities/${a.id}`} className="font-medium hover:text-primary">{a.title}</Link><div className="text-xs text-muted">{a.category.name}</div></Td>
                <Td className="whitespace-nowrap">{formatDateTime(a.startAt)}</Td><Td>{a.department?.name ?? "Toàn trường"}</Td>
                <Td className="text-right tabular-nums">{a._count.registrations}</Td><Td className="text-right tabular-nums">{a._count.attendances}</Td><Td className="text-right tabular-nums">{a.rate}%</Td></tr>
            ))}</tbody>
          </DataTable>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} basePath="/reports" params={{ month }} />
      </Section>
      {user.role === "ADMIN" && ranking.length > 0 && (
        <Section title="Xếp hạng Chi đoàn (toàn thời gian)">
          <DataTable>
            <thead><tr><Th>#</Th><Th>Chi đoàn</Th><Th className="text-right">Đoàn viên</Th><Th className="text-right">Lượt tham gia</Th><Th className="text-right">Tỷ lệ</Th></tr></thead>
            <tbody>{ranking.map((d, i) => <tr key={d.id}><Td>{i + 1}</Td><Td className="font-medium">{d.name}</Td><Td className="text-right tabular-nums">{d.members}</Td><Td className="text-right tabular-nums">{d.attended}</Td><Td className="text-right tabular-nums">{d.rate}%</Td></tr>)}</tbody>
          </DataTable>
        </Section>
      )}
    </>
  );
}
