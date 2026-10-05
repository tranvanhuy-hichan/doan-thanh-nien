import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { toLocalInput } from "@/utils";
import { PageHeader } from "@/components/ui/misc";
import { ArticleForm } from "@/components/cms/forms";

export const metadata = { title: "Sửa bài viết" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);
  const a = await db.article.findUnique({ where: { id: (await params).id } });
  if (!a) notFound();
  return (
    <>
      <PageHeader title="Sửa bài viết" />
      <ArticleForm id={a.id} image={a.coverUrl && a.coverPublicId ? { imageUrl: a.coverUrl, publicId: a.coverPublicId } : null}
        initial={{ kind: a.kind, title: a.title, summary: a.summary ?? "", content: a.content, eventAt: a.eventAt ? toLocalInput(a.eventAt) : "", eventLocation: a.eventLocation ?? "", published: a.published }} />
    </>
  );
}
