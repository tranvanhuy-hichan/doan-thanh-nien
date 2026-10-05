import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { canManageActivity } from "@/lib/permissions";
import { canOpenCheckin } from "@/lib/services/activity-status";
import { formatDateTime } from "@/utils";
import { PageHeader } from "@/components/ui/misc";
import { AttendancePanel } from "@/components/attendance/attendance-panel";

export const metadata = { title: "Điểm danh hoạt động" };

export default async function ActivityAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const { id } = await params;
  const a = await db.activity.findUnique({ where: { id } });
  if (!a || !canManageActivity(user, a)) notFound();

  const members = await db.member.findMany({
    where: { status: "ACTIVE", ...(a.departmentId ? { departmentId: a.departmentId } : {}) },
    orderBy: [{ class: { name: "asc" } }, { fullName: "asc" }],
    include: { class: true, attendances: { where: { activityId: id }, take: 1 } },
  });
  const roster = members.map((m) => ({
    memberId: m.id, code: m.code, fullName: m.fullName, className: m.class.name,
    attendanceId: m.attendances[0]?.id ?? null, checkedInAt: m.attendances[0]?.checkedInAt.toISOString() ?? null, method: m.attendances[0]?.method ?? null,
  }));

  return (
    <>
      <PageHeader title="Điểm danh hoạt động" description={`${a.title} · ${formatDateTime(a.startAt)}`} />
      <AttendancePanel activityId={id} title={a.title} open={a.checkinOpen} canOpen={canOpenCheckin(a)} roster={roster} total={members.length} />
    </>
  );
}
