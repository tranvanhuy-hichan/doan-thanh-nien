import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { CMS_SLUG, KIND_ACTION, KIND_LABEL } from "@/lib/services/public";
import { PageHeader } from "@/components/ui/misc";
import { ArticleForm } from "@/components/cms/forms";

export default async function NewArticlePage({ params }: { params: Promise<{ kind: string }> }) {
  await requireRole(["ADMIN"]);
  const { kind: slug } = await params;
  const kind = CMS_SLUG[slug];
  if (!kind) notFound();
  return (<><PageHeader title={KIND_ACTION[kind]} description={`${KIND_LABEL[kind]} hiển thị trên trang công khai của Đoàn trường.`} /><ArticleForm kind={kind} /></>);
}
