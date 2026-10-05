import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { canManageActivity } from "@/lib/permissions";
import { categories } from "@/lib/services/queries";
import { toLocalInput } from "@/utils";
import { PageHeader } from "@/components/ui/misc";
import { ActivityForm } from "@/components/activities/activity-form";

export const metadata = { title: "Sửa hoạt động" };

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const { id } = await params;
  const a = await db.activity.findUnique({ where: { id }, include: { _count: { select: { attendances: true } } } });
  if (!a || !canManageActivity(user, a) || a.cancelledAt) notFound();
  const [cats, departments] = await Promise.all([
    categories(),
    user.role === "ADMIN" ? db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  return (
    <>
      <PageHeader title="Sửa hoạt động" />
      <ActivityForm id={id} categories={cats} departments={departments}
        lockedDepartment={user.role === "SECRETARY" ? user.departmentName ?? undefined : undefined}
        pointsLocked={a._count.attendances > 0}
        image={a.imageUrl && a.imagePublicId ? { imageUrl: a.imageUrl, publicId: a.imagePublicId } : null}
        initial={{
          title: a.title, description: a.description ?? "", location: a.location, startAt: toLocalInput(a.startAt), endAt: toLocalInput(a.endAt),
          categoryId: a.categoryId, departmentId: a.departmentId ?? "", maxParticipants: a.maxParticipants ? String(a.maxParticipants) : "",
          points: String(a.points), volunteerHours: String(a.volunteerHours),
        }} />
    </>
  );
}
