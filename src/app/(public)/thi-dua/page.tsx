import { currentValue, resolvePeriod, PERIOD_LABEL, type PeriodType } from "@/lib/emulation-period";
import { cachedRanking } from "@/lib/services/emulation";
import { str } from "@/utils";
import { PageTitle } from "@/components/public/blocks";
import { PeriodFilter } from "@/components/emulation/period-filter";
import { RankingList } from "@/components/emulation/ranking-list";
import { DataTable, EmptyState, Td, Th } from "@/components/ui/misc";

export const metadata = { title: "Bảng thi đua" };

export default async function PublicEmulationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = str(sp.type);
  const type: PeriodType = raw && raw in PERIOD_LABEL ? (raw as PeriodType) : "month";
  const period = resolvePeriod(type, str(sp.value) ?? "") ?? resolvePeriod(type, currentValue(type))!;
  const ranking = await cachedRanking(period.type, period.value);
  const max = Math.max(1, ...ranking.map((r) => Math.abs(r.total)));
  return (
    <>
      <PageTitle title="Bảng thi đua Chi đoàn" description={period.label} />
      <PeriodFilter type={period.type} value={period.value} />
      {ranking.length === 0 ? <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có dữ liệu thi đua" /></div> : (
        <>
          <RankingList items={ranking.map((r) => ({ ...r, mine: false, canOpen: false }))} />
          <div className="max-sm:hidden">
            <DataTable>
              <thead><tr><Th>Hạng</Th><Th>Chi đoàn</Th><Th className="text-right">Đoàn viên</Th><Th className="text-right">Lượt tham gia</Th><Th className="text-right">Điểm hoạt động (TB)</Th><Th className="text-right">Điểm thi đua trường</Th><Th className="min-w-44">Tổng điểm</Th></tr></thead>
              <tbody>{ranking.map((r) => (
                <tr key={r.id}>
                  <Td className="font-semibold tabular-nums">{r.rank}</Td><Td className="font-medium">Chi đoàn {r.name}</Td>
                  <Td className="text-right tabular-nums">{r.members}</Td><Td className="text-right tabular-nums">{r.attendances}</Td>
                  <Td className="text-right tabular-nums">{r.activityScore}</Td><Td className="text-right tabular-nums">{r.schoolScore}</Td>
                  <Td><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${r.total < 0 ? "bg-danger" : "bg-primary"}`} style={{ width: `${(Math.abs(r.total) / max) * 100}%` }} /></div><span className="w-12 text-right font-semibold tabular-nums">{r.total}</span></div></Td>
                </tr>
              ))}</tbody>
            </DataTable>
          </div>
        </>
      )}
      <p className="mt-2 text-xs text-muted">Tổng điểm = Điểm thi đua trường (Đoàn trường ghi nhận) + Điểm hoạt động Đoàn bình quân mỗi đoàn viên.</p>
    </>
  );
}
