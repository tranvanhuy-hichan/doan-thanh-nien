import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { UserError } from "@/lib/action";
import { evaluateBadges } from "./badges";
import { canOpenCheckin } from "./activity-status";

type Activity = {
  id: string; title: string; departmentId: string | null; points: number; volunteerHours: number;
  startAt: Date; endAt: Date; cancelledAt: Date | null;
};
type MemberLite = { id: string; userId: string; departmentId: string; fullName: string; status: string };

export type RecordInput = {
  activity: Activity;
  member: MemberLite;
  method: "QR" | "MANUAL";
  actorUserId: string;
  meta?: { deviceInfo?: string | null; ipAddress?: string | null; latitude?: number; longitude?: number };
};

/**
 * Ghi nhận điểm danh + cộng điểm trong MỘT transaction.
 * Điểm luôn do backend tính từ Activity.points – client không gửi điểm.
 */
export async function recordAttendance({ activity, member, method, actorUserId, meta }: RecordInput) {
  if (member.status !== "ACTIVE") throw new UserError("Đoàn viên không còn sinh hoạt");
  if (activity.departmentId && activity.departmentId !== member.departmentId) {
    throw new UserError("Hoạt động này dành cho Chi đoàn khác");
  }

  try {
    return await db.$transaction(async (tx) => {
      const attendance = await tx.attendance.create({
        data: {
          activityId: activity.id,
          memberId: member.id,
          method,
          deviceInfo: meta?.deviceInfo?.slice(0, 300),
          ipAddress: meta?.ipAddress,
          latitude: meta?.latitude,
          longitude: meta?.longitude,
          checkedInById: method === "MANUAL" ? actorUserId : null,
        },
      });

      const points = activity.points;
      if (points > 0) {
        await tx.pointTransaction.create({
          data: {
            memberId: member.id, activityId: activity.id, attendanceId: attendance.id,
            type: "ACTIVITY", points, reason: `Tham gia: ${activity.title}`, createdById: actorUserId,
          },
        });
      }
      await tx.member.update({
        where: { id: member.id },
        data: { totalPoints: { increment: points }, volunteerMinutes: { increment: Math.round(activity.volunteerHours * 60) } },
      });

      await notifyUser(member.userId, {
        type: "CHECKIN", title: "Điểm danh thành công",
        body: `${activity.title}${points ? ` · +${points} điểm` : ""}`, link: `/activities/${activity.id}`,
      }, tx);
      if (points > 0) {
        await notifyUser(member.userId, { type: "POINTS", title: `Được cộng ${points} điểm`, body: activity.title, link: "/history" }, tx);
      }
      await evaluateBadges(tx, member.id);
      await audit(actorUserId, method === "QR" ? "attendance.checkin" : "attendance.manual", "Activity", activity.id,
        { memberId: member.id, points }, tx);

      return { attendance, points };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new UserError("Bạn đã điểm danh hoạt động này rồi");
    }
    throw e;
  }
}

/** Hoàn tác điểm danh: xóa bản ghi và ghi giao dịch điểm đối ứng để vẫn audit được. */
export async function revokeAttendance(attendanceId: string, actorUserId: string) {
  await db.$transaction(async (tx) => {
    const att = await tx.attendance.findUnique({
      where: { id: attendanceId },
      include: { activity: true, point: true },
    });
    if (!att) throw new UserError("Không tìm thấy bản ghi điểm danh");
    const points = att.point?.points ?? 0;
    const minutes = Math.round(att.activity.volunteerHours * 60);
    await tx.attendance.delete({ where: { id: att.id } });
    if (points) {
      await tx.pointTransaction.create({
        data: {
          memberId: att.memberId, activityId: att.activityId, type: "ADJUSTMENT", points: -points,
          reason: `Hủy điểm danh: ${att.activity.title}`, createdById: actorUserId,
        },
      });
    }
    await tx.member.update({
      where: { id: att.memberId },
      data: { totalPoints: { decrement: points }, volunteerMinutes: { decrement: minutes } },
    });
    await audit(actorUserId, "attendance.revoke", "Activity", att.activityId, { memberId: att.memberId, points }, tx);
  });
}

export function assertCheckinWindow(a: { startAt: Date; endAt: Date; cancelledAt: Date | null; checkinOpen: boolean }) {
  if (a.cancelledAt) throw new UserError("Hoạt động đã bị hủy");
  if (!a.checkinOpen) throw new UserError("Điểm danh chưa được mở hoặc đã đóng");
  if (!canOpenCheckin(a)) throw new UserError("Đã ngoài thời gian điểm danh của hoạt động");
}

