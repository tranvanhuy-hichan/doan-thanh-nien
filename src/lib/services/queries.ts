import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/permissions";

/** Điều kiện lọc Member theo phạm vi quyền của người xem. */
export function memberScope(user: SessionUser): Prisma.MemberWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "SECRETARY" && user.departmentId) return { departmentId: user.departmentId };
  if (user.role === "MEMBER" && user.memberId) return { id: user.memberId };
  return { id: "__none__" };
}

/** Lấy 1 đoàn viên, chỉ khi người xem có quyền (chống IDOR). */
export async function getMemberForUser(user: SessionUser, id: string) {
  return db.member.findFirst({
    where: { id, ...memberScope(user) },
    include: { class: true, department: true, user: { select: { username: true, status: true, lastLoginAt: true, mustChangePassword: true } } },
  });
}

/** Hoạt động mà người xem được thấy: toàn trường + chi đoàn của mình (Admin thấy tất cả). */
export function activityScope(user: SessionUser): Prisma.ActivityWhereInput {
  if (user.role === "ADMIN") return {};
  if (!user.departmentId) throw new ForbiddenError();
  return { OR: [{ departmentId: null }, { departmentId: user.departmentId }] };
}

export const categories = () => db.activityCategory.findMany({ orderBy: { name: "asc" } });

/** Tỷ lệ tham gia = lượt điểm danh / (số hoạt động đã diễn ra × số đoàn viên thuộc phạm vi hoạt động). */
export async function participationRate(departmentId?: string) {
  const now = new Date();
  const activities = await db.activity.findMany({
    where: { cancelledAt: null, startAt: { lte: now }, ...(departmentId ? { OR: [{ departmentId }, { departmentId: null }] } : {}) },
    select: { id: true, departmentId: true },
  });
  if (!activities.length) return 0;
  const [attended, deptCounts, total] = await Promise.all([
    db.attendance.count({ where: { activityId: { in: activities.map((a) => a.id) }, ...(departmentId ? { member: { departmentId } } : {}) } }),
    db.member.groupBy({ by: ["departmentId"], where: { status: "ACTIVE" }, _count: true }),
    db.member.count({ where: { status: "ACTIVE", ...(departmentId ? { departmentId } : {}) } }),
  ]);
  const size = new Map(deptCounts.map((d) => [d.departmentId, d._count]));
  const expected = activities.reduce((s, a) => s + (a.departmentId ? size.get(a.departmentId) ?? 0 : total), 0);
  return expected ? Math.min(100, Math.round((attended / expected) * 100)) : 0;
}

/** Bài viết mà người dùng được xem: toàn trường + Chi đoàn của mình (Admin xem tất cả). */
export function postScope(user: SessionUser): Prisma.PostWhereInput {
  if (user.role === "ADMIN") return {};
  if (!user.departmentId) return { departmentId: null };
  return { OR: [{ departmentId: null }, { departmentId: user.departmentId }] };
}
