import type { Prisma } from "@prisma/client";
import { notifyUser } from "@/lib/notify";

/** Xét và trao huy hiệu cho đoàn viên theo số liệu hiện tại. Gọi trong transaction. */
export async function evaluateBadges(tx: Prisma.TransactionClient, memberId: string) {
  const member = await tx.member.findUnique({
    where: { id: memberId },
    select: { userId: true, totalPoints: true, volunteerMinutes: true, badges: { select: { badgeId: true } } },
  });
  if (!member) return [];
  const owned = new Set(member.badges.map((b) => b.badgeId));
  const badges = await tx.badge.findMany({ where: { id: { notIn: [...owned] } } });
  if (!badges.length) return [];

  const activityCount = await tx.attendance.count({ where: { memberId } });
  const awarded: string[] = [];

  for (const b of badges) {
    let value = 0;
    switch (b.criteria) {
      case "ACTIVITY_COUNT": value = activityCount; break;
      case "VOLUNTEER_HOURS": value = Math.floor(member.volunteerMinutes / 60); break;
      case "TOTAL_POINTS": value = member.totalPoints; break;
      case "CATEGORY_COUNT":
        value = b.categoryId ? await tx.attendance.count({ where: { memberId, activity: { categoryId: b.categoryId } } }) : 0;
        break;
    }
    if (value >= b.threshold) {
      await tx.memberBadge.create({ data: { memberId, badgeId: b.id } });
      await notifyUser(member.userId, { type: "BADGE", title: `Đạt thành tích: ${b.name}`, body: b.description, link: "/achievements" }, tx);
      awarded.push(b.name);
    }
  }
  return awarded;
}
