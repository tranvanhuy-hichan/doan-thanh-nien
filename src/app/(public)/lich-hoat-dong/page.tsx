import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { cn, formatDateTime, formatTime, str } from "@/utils";
import { EmptyPublic, PageTitle } from "@/components/public/blocks";
import { FilterBar } from "@/components/ui/filter-bar";
import { currentWeek, defaultCalendar, rangeFromParams, schoolYearOf, weekRange } from "@/lib/school-calendar";
import { loadCalendars } from "@/lib/services/school-calendar";

export const metadata = { title: "Lịch hoạt động" };

const VN = 7 * 3600_000;
const DAY = 86400_000;
const dayKey = (d: Date) => new Date(d.getTime() + VN).toISOString().slice(0, 10);
const WEEKDAY = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const dayLabel = (d: Date) => { const v = new Date(d.getTime() + VN); return `${WEEKDAY[v.getUTCDay()]}, ${String(v.getUTCDate()).padStart(2, "0")}/${String(v.getUTCMonth() + 1).padStart(2, "0")}`; };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ nh?: string; tuan?: string }> }) {
  const sp = await searchParams;
  const nh = str(sp.nh), tuan = str(sp.tuan);
  const calendars = await loadCalendars();
  // Mặc định (chưa có tham số): tuần hiện tại của năm học hiện tại — hiển thị luôn, không chuyển hướng (tránh nháy khung chờ hai lần).
  const hasNh = !!nh;
  const curYear = schoolYearOf();
  const curCal = calendars.find((c) => c.startYear === curYear) ?? defaultCalendar(curYear);
  const defaultTuan = currentWeek(curCal);
  const nhEff = nh ?? String(curYear);
  const tuanEff = hasNh ? tuan : defaultTuan ? String(defaultTuan) : tuan;
  const range = rangeFromParams(calendars, nhEff, tuanEff);
  const cal = calendars.find((c) => String(c.startYear) === nhEff) ?? defaultCalendar(Number(nhEff));
  const weekNo = tuanEff && /^\d+$/.test(tuanEff) ? Number(tuanEff) : null;
  const isWeek = !!(weekNo && weekRange(cal, weekNo));

  const activities = await db.activity.findMany({
    where: { cancelledAt: null, startAt: { gte: range.from, lt: range.to } },
    orderBy: { startAt: "asc" },
    select: { id: true, title: true, startAt: true, endAt: true, location: true, department: { select: { name: true } }, category: { select: { name: true } } },
  });
  const byDay = new Map<string, typeof activities>();
  for (const a of activities) byDay.set(dayKey(a.startAt), [...(byDay.get(dayKey(a.startAt)) ?? []), a]);
  const today = dayKey(new Date());

  return (
    <>
      <PageTitle title="Lịch hoạt động" description={range.label}
        actions={<FilterBar className="" fields={[{ type: "schoolweek", name: "nh", calendars, defaultTuan: defaultTuan ? String(defaultTuan) : undefined }]} />} />

      {isWeek ? (
        // Một tuần: mỗi ngày một khối, hiện cả ngày không có hoạt động để thấy trọn tuần
        <div className="overflow-hidden rounded-lg border border-border bg-white/85">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(range.from.getTime() + i * DAY);
            const list = byDay.get(dayKey(d)) ?? [];
            return (
              <div key={i} className={cn("grid gap-x-4 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[9rem_1fr]", dayKey(d) === today && "bg-primary-light/50")}>
                <div className={cn("text-sm font-semibold", dayKey(d) === today ? "text-primary" : "text-primary-dark")}>{dayLabel(d)}{dayKey(d) === today && <span className="block text-xs font-normal whitespace-nowrap">(hôm nay)</span>}</div>
                <div className="space-y-2">
                  {list.length === 0 ? <div className="text-sm text-muted">—</div> : list.map((a) => (
                    <div key={a.id}>
                      <div className="font-medium">{formatTime(a.startAt)} – {formatTime(a.endAt)} · {a.title}</div>
                      <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{a.location}</span>
                        <span>{a.department ? `Chi đoàn ${a.department.name}` : "Toàn trường"} · {a.category.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
      )}
    </>
  );
}
