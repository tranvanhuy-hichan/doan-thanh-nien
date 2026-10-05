"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit, getRequestMeta } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { assertManageDepartment, canManageActivity, ForbiddenError } from "@/lib/permissions";
import { activitySchema } from "@/lib/validation";
import { activityStatus, canOpenCheckin } from "@/lib/services/activity-status";
import { assertCheckinWindow, recordAttendance, revokeAttendance } from "@/lib/services/attendance";
import { checkinUrl, signCheckinToken, verifyCheckinToken, CHECKIN_TOKEN_TTL_SECONDS } from "@/lib/qr/token";
import { notifyUsers } from "@/lib/notify";
import { deleteImage, isOwnPublicId } from "@/lib/cloudinary";
import { formatDateTime } from "@/utils";

async function loadManaged(activityId: string) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw new UserError("Không tìm thấy hoạt động");
  if (!canManageActivity(user, activity)) throw new ForbiddenError(); // chống IDOR giữa các Chi đoàn
  return { user, activity };
}

function resolveDepartment(user: Awaited<ReturnType<typeof requireRole>>, requested?: string) {
  if (user.role === "SECRETARY") return user.departmentId; // bí thư luôn bị ép về Chi đoàn của mình
  return requested || null;
}

export async function saveActivityAction(id: string | null, input: unknown) {
  return run<{ id: string }>(async () => {
    const user = await requireRole(["ADMIN", "SECRETARY"]);
    const data = activitySchema.parse(input);
    const departmentId = resolveDepartment(user, data.departmentId);
    if (user.role === "SECRETARY" && !departmentId) throw new ForbiddenError();
    if (data.imagePublicId && !isOwnPublicId(data.imagePublicId, "activities")) throw new UserError("Ảnh không hợp lệ");

    const cat = await db.activityCategory.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new UserError("Loại hoạt động không tồn tại");
    if (departmentId && !(await db.department.findUnique({ where: { id: departmentId } }))) throw new UserError("Chi đoàn không tồn tại");

    const fields = {
      title: data.title, description: data.description ?? null, location: data.location, startAt: data.startAt, endAt: data.endAt,
      categoryId: data.categoryId, departmentId, maxParticipants: data.maxParticipants ?? null,
      points: data.points, volunteerHours: data.volunteerHours,
    };

    if (id) {
      const existing = await db.activity.findUnique({ where: { id } });
      if (!existing) throw new UserError("Không tìm thấy hoạt động");
      assertManageDepartment(user, existing.departmentId);
      if (existing.departmentId !== departmentId && user.role !== "ADMIN") throw new ForbiddenError();
      if (existing.cancelledAt) throw new UserError("Hoạt động đã hủy, không thể chỉnh sửa");
      const attended = await db.attendance.count({ where: { activityId: id } });
      if (attended > 0 && (existing.points !== data.points || existing.volunteerHours !== data.volunteerHours)) {
        throw new UserError("Hoạt động đã có người điểm danh, không thể đổi điểm / giờ tình nguyện");
      }
      const imageChanged = (data.imagePublicId ?? null) !== existing.imagePublicId;
      await db.activity.update({
        where: { id },
        data: { ...fields, ...(existing.startAt.getTime() !== data.startAt.getTime() ? { reminderSentAt: null } : {}), imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null },
      });
      if (imageChanged) await deleteImage(existing.imagePublicId);
      await audit(user.id, "activity.update", "Activity", id, { title: data.title });
      revalidatePath("/activities");
      revalidatePath(`/activities/${id}`);
      return { data: { id }, message: "Đã cập nhật hoạt động" };
    }

    const activity = await db.activity.create({
      data: { ...fields, imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null, createdById: user.id },
    });
    const recipients = await db.member.findMany({
      where: { status: "ACTIVE", ...(departmentId ? { departmentId } : {}), user: { status: "ACTIVE" } },
      select: { userId: true },
    });
    const extra = departmentId ? await db.department.findUnique({ where: { id: departmentId }, select: { secretaryId: true } }) : null;
    const ids = new Set(recipients.map((r) => r.userId));
    if (extra?.secretaryId) ids.add(extra.secretaryId); // bí thư Chi đoàn cũng được báo
    ids.delete(user.id);
    await notifyUsers([...ids], {
      type: "ACTIVITY_CREATED", title: "Hoạt động mới", body: `${activity.title} · ${formatDateTime(activity.startAt)}`, link: `/activities/${activity.id}`,
    });
    await audit(user.id, "activity.create", "Activity", activity.id, { title: activity.title });
    revalidatePath("/activities");
    return { data: { id: activity.id }, message: "Đã tạo hoạt động" };
  });
}

export async function cancelActivityAction(id: string) {
  return run(async () => {
    const { user, activity } = await loadManaged(id);
    if (activity.cancelledAt) throw new UserError("Hoạt động đã được hủy trước đó");
    const attended = await db.attendance.count({ where: { activityId: id } });
    if (attended > 0) throw new UserError("Hoạt động đã có người điểm danh, không thể hủy");
    await db.activity.update({ where: { id }, data: { cancelledAt: new Date(), checkinOpen: false } });
    const regs = await db.activityRegistration.findMany({ where: { activityId: id, status: "REGISTERED" }, select: { member: { select: { userId: true } } } });
    await notifyUsers(regs.map((r) => r.member.userId), { type: "ACTIVITY_CANCELLED", title: "Hoạt động đã bị hủy", body: activity.title, link: `/activities/${id}` });
    await audit(user.id, "activity.cancel", "Activity", id, { title: activity.title });
    revalidatePath("/activities");
    revalidatePath(`/activities/${id}`);
    return { message: "Đã hủy hoạt động" };
  });
}

export async function deleteActivityAction(id: string) {
  return run(async () => {
    const { user, activity } = await loadManaged(id);
    const attended = await db.attendance.count({ where: { activityId: id } });
    if (attended > 0) throw new UserError("Hoạt động đã có dữ liệu điểm danh, hãy hủy hoạt động thay vì xóa");
    await db.activity.delete({ where: { id } });
    await deleteImage(activity.imagePublicId);
    await audit(user.id, "activity.delete", "Activity", id, { title: activity.title });
    revalidatePath("/activities");
    return { message: "Đã xóa hoạt động" };
  });
}

// ---------- Đăng ký ----------

export async function registerActivityAction(activityId: string, register: boolean) {
  return run(async () => {
    const user = await requireRole(["MEMBER"]);
    if (!user.memberId) throw new UserError("Tài khoản chưa gắn hồ sơ đoàn viên");
    await db.$transaction(async (tx) => {
      const a = await tx.activity.findUnique({ where: { id: activityId } });
      // Hoạt động của Chi đoàn khác coi như không tồn tại với đoàn viên này.
      if (!a || (a.departmentId && a.departmentId !== user.departmentId)) throw new UserError("Không tìm thấy hoạt động");
      if (register) {
        if (activityStatus(a) !== "UPCOMING" && activityStatus(a) !== "ONGOING") throw new UserError("Hoạt động không còn nhận đăng ký");
        if (a.maxParticipants) {
          const count = await tx.activityRegistration.count({ where: { activityId, status: "REGISTERED", NOT: { memberId: user.memberId! } } });
          if (count >= a.maxParticipants) throw new UserError("Hoạt động đã đủ số lượng");
        }
        await tx.activityRegistration.upsert({
          where: { activityId_memberId: { activityId, memberId: user.memberId! } },
          update: { status: "REGISTERED" },
          create: { activityId, memberId: user.memberId!, status: "REGISTERED" },
        });
        await tx.notification.create({ data: { userId: user.id, type: "REGISTRATION", title: "Đăng ký thành công", body: a.title, link: `/activities/${a.id}` } });
        await audit(user.id, "activity.register", "Activity", activityId, undefined, tx);
      } else {
        if (await tx.attendance.findUnique({ where: { activityId_memberId: { activityId, memberId: user.memberId! } } })) {
          throw new UserError("Bạn đã điểm danh, không thể hủy đăng ký");
        }
        await tx.activityRegistration.updateMany({ where: { activityId, memberId: user.memberId! }, data: { status: "CANCELLED" } });
        await audit(user.id, "activity.unregister", "Activity", activityId, undefined, tx);
      }
    });
    revalidatePath(`/activities/${activityId}`);
    return { message: register ? "Đã đăng ký tham gia" : "Đã hủy đăng ký" };
  });
}

// ---------- Điểm danh ----------

export async function setCheckinOpenAction(activityId: string, open: boolean) {
  return run(async () => {
    const { user, activity } = await loadManaged(activityId);
    if (open && !canOpenCheckin(activity)) throw new UserError("Chỉ mở điểm danh từ 60 phút trước giờ bắt đầu đến 120 phút sau giờ kết thúc");
    await db.activity.update({
      where: { id: activityId },
      // Mỗi lần mở dùng nonce mới: mọi QR cũ lập tức vô hiệu.
      data: open ? { checkinOpen: true, qrNonce: crypto.randomUUID() } : { checkinOpen: false },
    });
    await audit(user.id, open ? "attendance.open" : "attendance.close", "Activity", activityId);
    revalidatePath(`/activities/${activityId}`);
    revalidatePath(`/activities/${activityId}/attendance`);
    return { message: open ? "Đã mở điểm danh" : "Đã đóng điểm danh" };
  });
}

/** Cấp QR mới (token sống ngắn). Trang bí thư gọi định kỳ để làm mới. */
export async function getCheckinQrAction(activityId: string) {
  return run<{ url: string; ttl: number; count: number; open: boolean }>(async () => {
    const { activity } = await loadManaged(activityId);
    const count = await db.attendance.count({ where: { activityId } });
    if (!activity.checkinOpen) return { data: { url: "", ttl: 0, count, open: false } };
    const token = await signCheckinToken(activity.id, activity.qrNonce);
    return { data: { url: checkinUrl(token), ttl: CHECKIN_TOKEN_TTL_SECONDS, count, open: true } };
  });
}

export async function rotateCheckinQrAction(activityId: string) {
  return run(async () => {
    const { user } = await loadManaged(activityId);
    await db.activity.update({ where: { id: activityId }, data: { qrNonce: crypto.randomUUID() } });
    await audit(user.id, "attendance.rotate_qr", "Activity", activityId);
    return { message: "Đã tạo mã QR mới, mã cũ không còn hiệu lực" };
  });
}

export type CheckinSuccess = { activityTitle: string; fullName: string; className: string; at: string; points: number };

export async function checkInAction(token: string) {
  return run<CheckinSuccess>(async () => {
    const user = await requireRole(["MEMBER"]);
    if (!user.memberId) throw new UserError("Tài khoản chưa gắn hồ sơ đoàn viên");
    const parsed = await verifyCheckinToken(token);
    if (!parsed) throw new UserError("Mã QR không hợp lệ hoặc đã hết hạn, hãy quét lại mã đang hiển thị");

    const [activity, member] = await Promise.all([
      db.activity.findUnique({ where: { id: parsed.activityId } }),
      db.member.findUnique({ where: { id: user.memberId }, include: { class: true } }),
    ]);
    if (!activity || !member || activity.qrNonce !== parsed.nonce) throw new UserError("Mã QR không còn hiệu lực");
    assertCheckinWindow(activity);

    const meta = await getRequestMeta();
    const { attendance, points } = await recordAttendance({
      activity, member, method: "QR", actorUserId: user.id, meta: { deviceInfo: meta.userAgent, ipAddress: meta.ip },
    });
    revalidatePath("/dashboard");
    revalidatePath(`/activities/${activity.id}`);
    return {
      data: { activityTitle: activity.title, fullName: member.fullName, className: member.class.name, at: attendance.checkedInAt.toISOString(), points },
      message: "Điểm danh thành công",
    };
  });
}

/** Bí thư / Admin điểm danh hộ (trường hợp đoàn viên không có điện thoại). */
export async function manualCheckInAction(activityId: string, memberId: string) {
  return run(async () => {
    const { user, activity } = await loadManaged(activityId);
    if (activity.cancelledAt) throw new UserError("Hoạt động đã bị hủy");
    const member = await db.member.findUnique({ where: { id: memberId } });
    // Đoàn viên phải thuộc phạm vi quản lý của người thao tác
    if (!member) throw new UserError("Không tìm thấy đoàn viên");
    assertManageDepartment(user, member.departmentId);
    await recordAttendance({ activity, member, method: "MANUAL", actorUserId: user.id });
    revalidatePath(`/activities/${activityId}/attendance`);
    return { message: `Đã điểm danh cho ${member.fullName}` };
  });
}

export async function revokeAttendanceAction(attendanceId: string) {
  return run(async () => {
    const user = await requireRole(["ADMIN", "SECRETARY"]);
    const att = await db.attendance.findUnique({ where: { id: attendanceId }, include: { member: true } });
    if (!att) throw new UserError("Không tìm thấy bản ghi");
    assertManageDepartment(user, att.member.departmentId);
    await revokeAttendance(attendanceId, user.id);
    revalidatePath(`/activities/${att.activityId}/attendance`);
    return { message: "Đã hủy điểm danh và hoàn lại điểm" };
  });
}

