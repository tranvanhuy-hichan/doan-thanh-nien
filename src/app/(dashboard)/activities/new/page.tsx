import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { categories } from "@/lib/services/queries";
import { PageHeader } from "@/components/ui/misc";
import { ActivityForm } from "@/components/activities/activity-form";

export const metadata = { title: "Tạo hoạt động" };

export default async function NewActivityPage() {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const [cats, departments] = await Promise.all([
    categories(),
    user.role === "ADMIN" ? db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  return (
    <>
      <PageHeader title="Tạo hoạt động" back={{ href: "/activities" }} description="Sau khi tạo, hệ thống sinh mã QR điểm danh cho hoạt động." />
      <ActivityForm categories={cats} departments={departments} lockedDepartment={user.role === "SECRETARY" ? user.departmentName ?? undefined : undefined} />
    </>
  );
}
