import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { emulationRanking } from "@/lib/services/emulation";
import { currentValue, periodOptions, resolvePeriod, PERIOD_LABEL, type PeriodType } from "@/lib/emulation-period";
import { formatDate, formatDateShort, pageParam, str, toDateInput } from "@/utils";
import { DataTable, EmptyState, PageHeader, Pagination, Section, Td, Th } from "@/components/ui/misc";
import { PeriodFilter } from "@/components/emulation/period-filter";
import { AddRecordButton, DeleteRecordButton } from "@/components/emulation/record-actions";

export const metadata = { title: "Thi đua" };
const PAGE_SIZE = 10;

export default async function EmulationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const rawType = str(sp.type);
  const type: PeriodType = rawType && rawType in PERIOD_LABEL ? (rawType as PeriodType) : "month";
  const period = resolvePeriod(type, str(sp.value) ?? "") ?? resolvePeriod(type, currentValue(type))!;
  const page = pageParam(sp.page);
  const admin = user.role === "ADMIN";

  // Admin xem mọi bản ghi; các vai trò khác chỉ thấy bản ghi của Chi đoàn mình.
  const recWhere = { recordedAt: { gte: period.from, lt: period.to }, ...(admin ? {} : { departmentId: user.departmentId ?? "__none__" }) };
  const [ranking, records, recTotal, departments] = await Promise.all([
    emulationRanking(period),
    db.emulationRecord.findMany({ where: recWhere, orderBy: { recordedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { department: { select: { name: true } }, createdBy: { select: { fullName: true } } } }),
    db.emulationRecord.count({ where: recWhere }),
    admin ? db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const max = Math.max(1, ...ranking.map((r) => Math.abs(r.total)));

  return (
    <>
      <PageHeader title="Thi đua Chi đoàn" description={period.label}
        actions={admin && <AddRecordButton departments={departments} today={toDateInput(new Date())} />} />
      <PeriodFilter type={period.type} value={period.value} options={periodOptions()} />

      {ranking.length === 0 ? (
        <div className="rounded-lg border border-border bg-white"><EmptyState title="Chưa có Chi đoàn nào" /></div>
      ) : (
        <>
        <ul className="divide-y divide-border rounded-lg border border-border bg-white sm:hidden">
          {ranking.map((r) => (
            <li key={r.id} className={`px-3 py-2.5 ${user.departmentId === r.id ? "bg-primary-light/50" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${r.rank <= 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>{r.rank}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{canManageDepartment(user, r.id) ? <Link href={`/departments/${r.id}`} className="text-primary">{r.name}</Link> : r.name}</div>
                  <div className="truncate text-xs text-muted">{r.members} đoàn viên · {r.attendances} lượt · HĐ {r.activityScore} + Trường {r.schoolScore}</div>
                </div>
                <span className="text-lg font-semibold tabular-nums">{r.total}</span>
              </div>
              <div className="mt-2 ml-10 h-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${r.total < 0 ? "bg-danger" : "bg-primary"}`} style={{ width: `${(Math.abs(r.total) / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Hạng</Th><Th>Chi đoàn</Th><Th className="text-right">Đoàn viên</Th><Th className="text-right">Lượt tham gia</Th><Th className="text-right">Điểm hoạt động (TB)</Th><Th className="text-right">Điểm thi đua trường</Th><Th className="min-w-44">Tổng điểm</Th></tr></thead>
          <tbody>
            {ranking.map((r) => (
              <tr key={r.id} className={user.departmentId === r.id ? "bg-primary-light/50" : "hover:bg-slate-50"}>
                <Td className="font-semibold tabular-nums">{r.rank}</Td>
                <Td className="font-medium">{canManageDepartment(user, r.id) ? <Link href={`/departments/${r.id}`} className="text-primary hover:underline">{r.name}</Link> : r.name}</Td>
                <Td className="text-right tabular-nums">{r.members}</Td>
                <Td className="text-right tabular-nums">{r.attendances}</Td>
                <Td className="text-right tabular-nums"><span title={`Tổng ${r.activityTotal} điểm / ${r.members} đoàn viên`}>{r.activityScore}</span></Td>
                <Td className="text-right tabular-nums">{r.schoolScore}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${r.total < 0 ? "bg-danger" : "bg-primary"}`} style={{ width: `${(Math.abs(r.total) / max) * 100}%` }} /></div>
                    <span className="w-12 text-right font-semibold tabular-nums">{r.total}</span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        </div>
        </>
      )}
      <p className="mt-2 text-xs text-muted">
        Tổng điểm = Điểm thi đua trường (Đoàn trường ghi nhận) + Điểm hoạt động Đoàn bình quân mỗi đoàn viên (tổng điểm điểm danh của đoàn viên trong kỳ ÷ số đoàn viên). Năm học tính từ 1/9; Học kỳ 1: 9–12, Học kỳ 2: 1–8.
      </p>

      <Section title={admin ? "Điểm thi đua trường đã ghi nhận" : "Điểm thi đua trường của Chi đoàn bạn"} className="mt-8">
        {records.length === 0 ? <div className="rounded-lg border border-border bg-white"><EmptyState title="Chưa có bản ghi trong kỳ này" /></div> : (
          <>
          <ul className="divide-y divide-border rounded-lg border border-border bg-white sm:hidden">
            {records.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm">{r.reason}</div>
                  <div className="truncate text-xs text-muted">{formatDateShort(r.recordedAt)} · {r.department.name}{r.createdBy ? ` · ${r.createdBy.fullName}` : ""}</div>
                </div>
                <span className={`text-base font-semibold tabular-nums ${r.points < 0 ? "text-danger" : "text-primary"}`}>{r.points > 0 ? "+" : ""}{r.points}</span>
                {admin && <DeleteRecordButton id={r.id} />}
              </li>
            ))}
          </ul>
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>Ngày</Th><Th>Chi đoàn</Th><Th>Nội dung</Th><Th className="text-right">Điểm</Th><Th>Người ghi</Th>{admin && <Th />}</tr></thead>
            <tbody>{records.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{formatDate(r.recordedAt)}</Td><Td className="font-medium">{r.department.name}</Td><Td>{r.reason}</Td>
                <Td className={`text-right font-medium tabular-nums ${r.points < 0 ? "text-danger" : "text-primary"}`}>{r.points > 0 ? "+" : ""}{r.points}</Td>
                <Td>{r.createdBy?.fullName ?? "—"}</Td>
                {admin && <Td className="text-right"><DeleteRecordButton id={r.id} /></Td>}
              </tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={recTotal} basePath="/emulation" params={{ type: period.type, value: period.value }} />
      </Section>
    </>
  );
}
