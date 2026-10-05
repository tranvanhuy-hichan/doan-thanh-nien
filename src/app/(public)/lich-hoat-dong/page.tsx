import { db } from "@/lib/db";
import { cn, formatDateTime, formatTime, monthParamRange, str } from "@/utils";
import { EmptyPublic, PageTitle } from "@/components/public/blocks";
import { FilterBar } from "@/components/ui/filter-bar";
import { MapPin } from "lucide-react";

export const metadata = { title: "Lịch hoạt động" };

const VN = 7 * 3600_000;
const dayKey = (d: Date) => new Date(d.getTime() + VN).toISOString().slice(0, 10);
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const raw = str((await searchParams).month);
  const nowVn = new Date(Date.now() + VN);
  const defaultMonth = `${nowVn.getUTCFullYear()}-${String(nowVn.getUTCMonth() + 1).padStart(2, "0")}`;
  const value = monthParamRange(raw) ? raw! : defaultMonth;
  const range = monthParamRange(value)!;
  const isMonth = /^\d{4}-\d{2}$/.test(value);

  const activities = await db.activity.findMany({
    where: { cancelledAt: null, startAt: { gte: range.from, lt: range.to } },
    orderBy: { startAt: "asc" },
    select: { id: true, title: true, startAt: true, endAt: true, location: true, department: { select: { name: true } }, category: { select: { name: true } } },
  });

  const byDay = new Map<string, typeof activities>();
  for (const a of activities) byDay.set(dayKey(a.startAt), [...(byDay.get(dayKey(a.startAt)) ?? []), a]);

  let cells: { date: string | null; day?: number }[] = [];
  if (isMonth) {
    const [y, m] = value.split("-").map(Number);
    const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // thứ Hai = 0
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    cells = [...Array(lead).fill({ date: null }), ...Array.from({ length: days }, (_, i) => ({ date: `${value}-${String(i + 1).padStart(2, "0")}`, day: i + 1 }))];
    while (cells.length % 7) cells.push({ date: null });
  }
  const today = dayKey(new Date());

  return (
    <>
      <PageTitle title="Lịch hoạt động" description={isMonth ? `Tháng ${+value.slice(5)}/${value.slice(0, 4)}` : `Năm ${value}`} />
      <FilterBar fields={[{ type: "month", name: "month" }]} />

      {isMonth && (
        <div className="mb-6 hidden overflow-hidden rounded-lg border border-border bg-white/85 md:block">
          <div className="grid grid-cols-7 border-b border-border bg-primary-light text-center text-xs font-semibold text-primary-dark">
            {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c, i) => (
              <div key={i} className={cn("min-h-24 border-r border-b border-border p-1.5 text-xs [&:nth-child(7n)]:border-r-0", !c.date && "bg-slate-50/60", c.date === today && "bg-primary-light/60")}>
                {c.date && <div className={cn("mb-1 font-semibold", c.date === today && "text-primary")}>{c.day}</div>}
                {c.date && byDay.get(c.date)?.slice(0, 3).map((a) => (
                  <div key={a.id} className="mb-0.5 truncate rounded bg-primary px-1.5 py-0.5 text-white" title={`${a.title} · ${formatTime(a.startAt)}`}>{formatTime(a.startAt)} {a.title}</div>
                ))}
                {c.date && (byDay.get(c.date)?.length ?? 0) > 3 && <div className="text-muted">+{(byDay.get(c.date)?.length ?? 0) - 3} nữa</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-white/85 px-4">
        {activities.length === 0 ? <EmptyPublic text="Không có hoạt động trong thời gian này." /> : activities.map((a) => (
          <div key={a.id} className="border-b border-border py-3 last:border-0">
            <div className="font-semibold">{a.title}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
              <span>{formatDateTime(a.startAt)}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{a.location}</span>
              <span>{a.department ? `Chi đoàn ${a.department.name}` : "Toàn trường"} · {a.category.name}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
