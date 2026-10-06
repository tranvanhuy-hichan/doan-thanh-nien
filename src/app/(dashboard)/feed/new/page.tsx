import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { PostComposer } from "@/components/feed/composer";

export const metadata = { title: "Đăng bài" };

export default async function NewPostPage() {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const departments = user.role === "ADMIN" ? await db.department.findMany({ where: { graduatedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : [];
  return (
    <>
      <PageHeader title="Đăng bài" />
      <PostComposer userName={user.fullName} avatarUrl={user.avatarUrl} departments={departments}
        fixedAudience={user.role === "SECRETARY" ? user.departmentName ?? undefined : undefined} />
    </>
  );
}
