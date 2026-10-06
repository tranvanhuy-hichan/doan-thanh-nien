import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { resolvePeriod, type Period, type PeriodType } from "@/lib/emulation-period";

export type RankRow = {
  id: string; name: string; members: number; attendances: number;
  activityTotal: number; activityScore: number; schoolScore: number; total: number; rank: number;
};

/**
 * Điểm thi đua Chi đoàn trong kỳ = Điểm thi đua trường (Admin ghi nhận)
 *                                 + Điểm hoạt động Đoàn bình quân đầu đoàn viên.
 * Bình quân giúp Chi đoàn đông và ít người được so sánh công bằng.
 */
export async function emulationRanking(period: Period): Promise<RankRow[]> {
  const { from, to } = period;
  const [departments, points, attendance, school] = await Promise.all([
    db.department.findMany({ where: { graduatedAt: null }, select: { id: true, name: true, _count: { select: { members: { where: { status: "ACTIVE" } } } } } }),
    db.$queryRaw<{ departmentId: string; sum: number }[]>`
      SELECT m."departmentId" AS "departmentId", COALESCE(SUM(p.points), 0)::int AS sum
      FROM "PointTransaction" p JOIN "Member" m ON m.id = p."memberId"
      WHERE p."createdAt" >= ${from} AND p."createdAt" < ${to}
      GROUP BY m."departmentId"`,
    db.$queryRaw<{ departmentId: string; count: number }[]>`
      SELECT m."departmentId" AS "departmentId", COUNT(*)::int AS count
      FROM "Attendance" a JOIN "Member" m ON m.id = a."memberId"
      WHERE a."checkedInAt" >= ${from} AND a."checkedInAt" < ${to}
      GROUP BY m."departmentId"`,
    db.emulationRecord.groupBy({ by: ["departmentId"], where: { recordedAt: { gte: from, lt: to } }, _sum: { points: true } }),
  ]);
  const pts = new Map(points.map((r) => [r.departmentId, r.sum]));
  const att = new Map(attendance.map((r) => [r.departmentId, r.count]));
  const sch = new Map(school.map((r) => [r.departmentId, r._sum.points ?? 0]));

  const rows = departments.map((d) => {
    const members = d._count.members;
    const activityTotal = pts.get(d.id) ?? 0;
    const activityScore = Math.round((activityTotal / Math.max(1, members)) * 10) / 10;
    const schoolScore = sch.get(d.id) ?? 0;
    return { id: d.id, name: d.name, members, attendances: att.get(d.id) ?? 0, activityTotal, activityScore, schoolScore, total: Math.round((activityScore + schoolScore) * 10) / 10, rank: 0 };
  }).sort((a, b) => b.total - a.total || b.schoolScore - a.schoolScore || a.name.localeCompare(b.name, "vi"));

  // Đồng hạng khi cùng tổng điểm
  rows.forEach((r, i) => { r.rank = i > 0 && rows[i - 1].total === r.total ? rows[i - 1].rank : i + 1; });
  return rows;
}

/** Bản có cache 5 phút cho các trang công khai (nhiều người xem, dữ liệu ít đổi). */
export const cachedRanking = unstable_cache(
  async (type: PeriodType, value: string) => {
    const period = resolvePeriod(type, value);
    return period ? emulationRanking(period) : [];
  },
  ["emulation-ranking"],
  { revalidate: 300 },
);
