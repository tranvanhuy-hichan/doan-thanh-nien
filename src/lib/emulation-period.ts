// Tính khoảng thời gian thi đua theo giờ Việt Nam (UTC+7). Dùng được ở cả server và client.
export type PeriodType = "week" | "month" | "semester" | "year";
export const PERIOD_LABEL: Record<PeriodType, string> = { week: "Tuần", month: "Tháng", semester: "Học kỳ", year: "Năm học" };

const VN = 7 * 3600_000;
const DAY = 86400_000;
/** 00:00 giờ VN của ngày (y, m0, d) dưới dạng instant. */
const vnMidnight = (y: number, m0: number, d: number) => new Date(Date.UTC(y, m0, d) - VN);
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (d: Date) => { const v = new Date(d.getTime() + VN); return `${pad(v.getUTCDate())}/${pad(v.getUTCMonth() + 1)}`; };

/** Năm bắt đầu của năm học chứa thời điểm `d` (năm học: 1/9 – 31/8). */
export function schoolYearStart(d: Date) {
  const v = new Date(d.getTime() + VN);
  return v.getUTCMonth() >= 8 ? v.getUTCFullYear() : v.getUTCFullYear() - 1;
}

function isoWeekParts(d: Date) {
  const v = new Date(d.getTime() + VN);
  const t = new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / DAY + 1) / 7);
  return { year, week };
}
export const weekValue = (d: Date) => { const { year, week } = isoWeekParts(d); return `${year}-W${pad(week)}`; };
export const monthValue = (d: Date) => { const v = new Date(d.getTime() + VN); return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}`; };
export const semesterValue = (d: Date) => {
  const v = new Date(d.getTime() + VN);
  return `${schoolYearStart(d)}-${v.getUTCMonth() >= 8 ? 1 : 2}`; // HK1: 9–12, HK2: 1–8
};

export type Period = { type: PeriodType; value: string; from: Date; to: Date; label: string };

/** `to` là cận trên loại trừ. Trả null nếu giá trị không hợp lệ. */
export function resolvePeriod(type: PeriodType, value: string): Period | null {
  if (type === "week") {
    const m = value.match(/^(\d{4})-W(\d{2})$/);
    if (!m) return null;
    const y = +m[1], w = +m[2];
    const jan4 = new Date(Date.UTC(y, 0, 4));
    const mondayUtc = jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * DAY + (w - 1) * 7 * DAY;
    const mon = new Date(mondayUtc);
    const from = vnMidnight(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate());
    const to = new Date(from.getTime() + 7 * DAY);
    return { type, value, from, to, label: `Tuần ${w} (${fmt(from)} – ${fmt(new Date(to.getTime() - DAY))}/${new Date(to.getTime() - DAY + VN).getUTCFullYear()})` };
  }
  if (type === "month") {
    const m = value.match(/^(\d{4})-(\d{2})$/);
    if (!m || +m[2] < 1 || +m[2] > 12) return null;
    return { type, value, from: vnMidnight(+m[1], +m[2] - 1, 1), to: vnMidnight(+m[1], +m[2], 1), label: `Tháng ${+m[2]}/${m[1]}` };
  }
  if (type === "semester") {
    const m = value.match(/^(\d{4})-([12])$/);
    if (!m) return null;
    const y = +m[1];
    return m[2] === "1"
      ? { type, value, from: vnMidnight(y, 8, 1), to: vnMidnight(y + 1, 0, 1), label: `Học kỳ 1 · Năm học ${y}–${y + 1}` }
      : { type, value, from: vnMidnight(y + 1, 0, 1), to: vnMidnight(y + 1, 8, 1), label: `Học kỳ 2 · Năm học ${y}–${y + 1}` };
  }
  const m = value.match(/^(\d{4})$/);
  if (!m) return null;
  const y = +m[1];
  return { type, value, from: vnMidnight(y, 8, 1), to: vnMidnight(y + 1, 8, 1), label: `Năm học ${y}–${y + 1}` };
}

export function currentValue(type: PeriodType, now = new Date()) {
  return type === "week" ? weekValue(now) : type === "month" ? monthValue(now) : type === "semester" ? semesterValue(now) : String(schoolYearStart(now));
}

/** Danh sách lựa chọn gần đây để người dùng chọn kỳ thi đua. */
export function periodOptions(now = new Date()): Record<PeriodType, { value: string; label: string }[]> {
  const out = { week: [], month: [], semester: [], year: [] } as Record<PeriodType, { value: string; label: string }[]>;
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getTime() - i * 7 * DAY);
    const v = weekValue(d);
    if (!out.week.some((o) => o.value === v)) out.week.push({ value: v, label: resolvePeriod("week", v)!.label });
  }
  const v = new Date(now.getTime() + VN);
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth() - i, 15));
    const mv = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    out.month.push({ value: mv, label: resolvePeriod("month", mv)!.label });
  }
  const sy = schoolYearStart(now);
  for (let y = sy; y > sy - 4; y--) {
    out.year.push({ value: String(y), label: resolvePeriod("year", String(y))!.label });
    out.semester.push({ value: `${y}-2`, label: resolvePeriod("semester", `${y}-2`)!.label }, { value: `${y}-1`, label: resolvePeriod("semester", `${y}-1`)!.label });
  }
  return out;
}
