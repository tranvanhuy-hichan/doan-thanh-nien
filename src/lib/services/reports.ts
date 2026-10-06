import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { activityScope, memberScope } from "./queries";

export type TimeRange = { from: Date; to: Date } | null;

export async function activityReport(user: SessionUser, range?: TimeRange) {
  const activities = await db.activity.findMany({
    where: { AND: [activityScope(user), { cancelledAt: null, startAt: { lte: new Date() } }, range ? { startAt: { gte: range.from, lt: range.to } } : {}] },
    orderBy: { startAt: "desc" }, take: 500,
    include: { category: true, department: true, _count: { select: { registrations: { where: { status: "REGISTERED" } }, attendances: user.role === "SECRETARY" ? { where: { member: { departmentId: user.departmentId! } } } : true } } },
  });
  const sizes = await db.member.groupBy({ by: ["departmentId"], where: { status: "ACTIVE" }, _count: true });
  const size = new Map(sizes.map((s) => [s.departmentId, s._count]));
  const total = sizes.reduce((s, x) => s + x._count, 0);
  return activities.map((a) => {
    const scopeSize = a.departmentId ? size.get(a.departmentId) ?? 0 : user.role === "SECRETARY" ? size.get(user.departmentId!) ?? 0 : total;
    return { ...a, expected: scopeSize, rate: scopeSize ? Math.min(100, Math.round((a._count.attendances / scopeSize) * 100)) : 0 };
  });
}

export async function memberReport(user: SessionUser) {
  return db.member.findMany({
    where: memberScope(user), orderBy: [{ totalPoints: "desc" }, { fullName: "asc" }], take: 2000,
    include: { class: true, department: true, _count: { select: { attendances: true, badges: true } } },
  });
}
