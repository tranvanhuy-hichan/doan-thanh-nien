import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { CMS_SLUG, KIND_LABEL } from "@/lib/services/public";
import { toLocalInput } from "@/utils";
import { PageHeader } from "@/components/ui/misc";
import { ArticleForm } from "@/components/cms/forms";

export default async function EditArticlePage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  await requireRole(["ADMIN"]);
  const { kind: slug, id } = await params;
  const kind = CMS_SLUG[slug];
  const a = kind ? await db.article.findFirst({ where: { id, kind } }) : null; // chỉ sửa trong đúng loại của route
  if (!a) notFound();
  return (
    <>
      <PageHeader title={`Sửa ${KIND_LABEL[a.kind].toLowerCase()}`} />
      <ArticleForm id={a.id} kind={a.kind} image={a.coverUrl && a.coverPublicId ? { imageUrl: a.coverUrl, publicId: a.coverPublicId } : null}
        initial={{ title: a.title, summary: a.summary ?? "", content: a.content, eventAt: a.eventAt ? toLocalInput(a.eventAt) : "", eventLocation: a.eventLocation ?? "", published: a.published }} />
    </>
  );
}
