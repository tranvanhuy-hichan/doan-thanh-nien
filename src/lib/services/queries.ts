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

/** Tỷ lệ tham gia của một Chi đoàn (dùng chung công thức với bảng xếp hạng). */
export async function participationRate(departmentId: string) {
  const { departmentRanking } = await import("./stats");
  return (await departmentRanking()).find((d) => d.id === departmentId)?.rate ?? 0;
}

/** Bài viết mà người dùng được xem: toàn trường + Chi đoàn của mình (Admin xem tất cả). */
export function postScope(user: SessionUser): Prisma.PostWhereInput {
  if (user.role === "ADMIN") return {};
  if (!user.departmentId) return { departmentId: null };
  return { OR: [{ departmentId: null }, { departmentId: user.departmentId }] };
}
