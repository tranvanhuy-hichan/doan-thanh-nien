import "server-only";
import { db } from "@/lib/db";

const monthKey = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(d).slice(0, 7);

/** Tỷ lệ tham gia theo tháng (6 tháng gần nhất) = lượt điểm danh / lượt kỳ vọng. */
export async function monthlyParticipation(departmentId?: string, months = 6) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 15)));
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [activities, sizes] = await Promise.all([
    db.activity.findMany({
      where: { cancelledAt: null, startAt: { gte: from, lte: now }, ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {}) },
      select: { startAt: true, departmentId: true, _count: { select: { attendances: departmentId ? { where: { member: { departmentId } } } : true } } },
    }),
    db.member.groupBy({ by: ["departmentId"], where: { status: "ACTIVE" }, _count: true }),
  ]);
  const size = new Map(sizes.map((s) => [s.departmentId, s._count]));
  const total = departmentId ? size.get(departmentId) ?? 0 : sizes.reduce((n, s) => n + s._count, 0);
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

/** Xếp hạng Chi đoàn theo tỷ lệ tham gia (các hoạt động đã diễn ra). 4 truy vấn song song, kết quả gộp sẵn ở DB. */
export async function departmentRanking() {
  const [departments, activities, attended] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true, _count: { select: { members: { where: { status: "ACTIVE" } } } } } }),
    db.activity.groupBy({ by: ["departmentId"], where: { cancelledAt: null, startAt: { lte: new Date() } }, _count: true }),
    db.$queryRaw<{ departmentId: string; count: number }[]>`
      SELECT m."departmentId" AS "departmentId", COUNT(*)::int AS count
      FROM "Attendance" a
      JOIN "Member" m ON m.id = a."memberId"
      JOIN "Activity" ac ON ac.id = a."activityId"
      WHERE ac."cancelledAt" IS NULL AND ac."startAt" <= now()
      GROUP BY m."departmentId"`,
  ]);
  const attendedBy = new Map(attended.map((r) => [r.departmentId, r.count]));
  const own = new Map(activities.map((a) => [a.departmentId, a._count]));
  const schoolWide = own.get(null) ?? 0;
  return departments.map((d) => {
    const expected = ((own.get(d.id) ?? 0) + schoolWide) * d._count.members;
    const done = attendedBy.get(d.id) ?? 0;
    return { id: d.id, name: d.name, members: d._count.members, attended: done, rate: expected ? Math.min(100, Math.round((done / expected) * 100)) : 0 };
  }).sort((a, b) => b.rate - a.rate || b.attended - a.attended);
}
