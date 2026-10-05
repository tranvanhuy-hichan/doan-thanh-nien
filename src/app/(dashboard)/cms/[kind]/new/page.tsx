import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { CMS_SLUG, KIND_ACTION, KIND_LABEL } from "@/lib/services/public";
import { PageHeader } from "@/components/ui/misc";
import { ArticleForm } from "@/components/cms/forms";

export default async function NewArticlePage({ params }: { params: Promise<{ kind: string }> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const { kind: slug } = await params;
  const kind = CMS_SLUG[slug];
  if (!kind) notFound();
  return (<><PageHeader title={KIND_ACTION[kind]} description={user.role === "ADMIN" ? `${KIND_LABEL[kind]} hiển thị trên trang công khai của Đoàn trường.` : "Lưu dưới dạng bản nháp để Admin duyệt."} /><ArticleForm kind={kind} draftOnly={user.role !== "ADMIN"} /></>);
}
