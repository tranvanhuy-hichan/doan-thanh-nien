import "server-only";
import { db } from "@/lib/db";

const monthKey = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(d).slice(0, 7);

/** Tỷ lệ tham gia theo tháng (6 tháng gần nhất) = lượt điểm danh / lượt kỳ vọng. */
export async function monthlyParticipation(departmentId?: string, months = 6) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 15)));
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [activities, sizes, total] = await Promise.all([
    db.activity.findMany({
      where: { cancelledAt: null, startAt: { gte: from, lte: now }, ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {}) },
      select: { startAt: true, departmentId: true, _count: { select: { attendances: departmentId ? { where: { member: { departmentId } } } : true } } },
    }),
    db.member.groupBy({ by: ["departmentId"], where: { status: "ACTIVE" }, _count: true }),
    db.member.count({ where: { status: "ACTIVE", ...(departmentId ? { departmentId } : {}) } }),
  ]);
  const size = new Map(sizes.map((s) => [s.departmentId, s._count]));
  const agg = new Map(keys.map((k) => [k, { attended: 0, expected: 0, activities: 0 }]));
  for (const a of activities) {
    const row = agg.get(monthKey(a.startAt));
    if (!row) continue;
    row.attended += a._count.attendances;
    row.expected += a.departmentId ? size.get(a.departmentId) ?? 0 : total;
    row.activities += 1;
  }
  return keys.map((k) => {
    const r = agg.get(k)!;
    const [y, m] = k.split("-");
    return { month: `T${Number(m)}/${y.slice(2)}`, rate: r.expected ? Math.min(100, Math.round((r.attended / r.expected) * 100)) : 0, attended: r.attended, activities: r.activities };
  });
}

/** Xếp hạng Chi đoàn theo tỷ lệ tham gia (các hoạt động đã diễn ra). */
export async function departmentRanking() {
  const now = new Date();
  const [departments, activities, attendances] = await Promise.all([
    db.department.findMany({ include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } } }),
    db.activity.findMany({ where: { cancelledAt: null, startAt: { lte: now } }, select: { id: true, departmentId: true } }),
    db.attendance.findMany({ where: { activity: { cancelledAt: null, startAt: { lte: now } } }, select: { member: { select: { departmentId: true } }, activityId: true } }),
  ]);
  const attendedBy = new Map<string, number>();
  for (const a of attendances) attendedBy.set(a.member.departmentId, (attendedBy.get(a.member.departmentId) ?? 0) + 1);
  const schoolWide = activities.filter((a) => !a.departmentId).length;
  return departments.map((d) => {
    const own = activities.filter((a) => a.departmentId === d.id).length;
    const expected = (own + schoolWide) * d._count.members;
    return { id: d.id, name: d.name, members: d._count.members, attended: attendedBy.get(d.id) ?? 0, rate: expected ? Math.min(100, Math.round(((attendedBy.get(d.id) ?? 0) / expected) * 100)) : 0 };
  }).sort((a, b) => b.rate - a.rate || b.attended - a.attended);
}
