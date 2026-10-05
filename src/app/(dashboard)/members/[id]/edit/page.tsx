import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { toDateInput } from "@/utils";
import { PageHeader } from "@/components/ui/misc";
import { MemberForm } from "@/components/members/member-form";

export const metadata = { title: "Sửa đoàn viên" };

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const [m, departments] = await Promise.all([
    db.member.findUnique({ where: { id }, include: { class: true } }),
    db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!m) notFound();
  return (
    <>
      <PageHeader title={`Sửa: ${m.fullName}`} back={{ href: `/members/${id}` }} description={`Mã đoàn viên ${m.code}`} />
      <MemberForm id={id} departments={departments} initial={{
        fullName: m.fullName, gender: m.gender ?? "", dateOfBirth: toDateInput(m.dateOfBirth), joinedAt: toDateInput(m.joinedAt),
        cohort: m.cohort ?? "", departmentId: m.departmentId, className: m.class.name, status: m.status,
        avatar: m.avatarUrl && m.avatarPublicId ? { imageUrl: m.avatarUrl, publicId: m.avatarPublicId } : null,
      }} />
    </>
  );
}
