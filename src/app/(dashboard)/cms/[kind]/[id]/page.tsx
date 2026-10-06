import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { CMS_SLUG, KIND_LABEL, articleHref } from "@/lib/services/public";
import { formatDate, formatDateTime } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/ui/misc";
import { ArticleRowActions, ArticleStatus } from "@/components/cms/row-actions";
import { RichText } from "@/components/public/rich-text";
import { Attachments } from "@/components/public/attachments";

export default async function CmsArticleDetail({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const isAdmin = user.role === "ADMIN";
  const { kind: slug, id } = await params;
  const kind = CMS_SLUG[slug];
  const a = kind ? await db.article.findFirst({ where: { id, kind }, include: { attachments: { orderBy: { createdAt: "asc" } }, author: { select: { fullName: true, role: true } } } }) : null;
  if (!a || (!isAdmin && a.authorId !== user.id)) notFound();
  const base = `/cms/${slug}`;
  return (
    <>
      <PageHeader title={a.title} stackActions
        actions={<>
          {isAdmin && a.published && <Link href={articleHref(a.slug)} target="_blank" className={buttonClass("secondary")}><ExternalLink className="size-4" /><span className="max-sm:hidden">Xem công khai</span></Link>}
          {(isAdmin || !a.published) && <ArticleRowActions id={a.id} published={a.published} base={base} backToList ownerOnly={!isAdmin} />}
        </>} />
      <div className="mb-4 space-y-1 text-sm text-muted">
        {/* Một hàng: trạng thái · ngày tạo · người đăng (rút gọn nhãn, tên dài thì cắt "…") */}
        <div className="flex items-center gap-x-3 whitespace-nowrap">
          <ArticleStatus published={a.published} pending={!a.published && a.author?.role === "SECRETARY"} />
          <span className="shrink-0">{formatDate(a.createdAt)}</span>
          {a.author?.fullName && <span className="min-w-0 truncate" title={`Người đăng: ${a.author.fullName}`}>· {a.author.fullName}</span>}
        </div>
        {(a.eventAt || a.eventLocation) && (
          <div className="flex flex-wrap gap-x-4">
            {a.eventAt && <span>Thời gian: {formatDateTime(a.eventAt)}</span>}
            {a.eventLocation && <span>Địa điểm: {a.eventLocation}</span>}
          </div>
        )}
      </div>
      {a.summary && <p className="mb-4 font-medium">{a.summary}</p>}
      <RichText text={a.content} />
      <div className="mt-4"><Attachments files={a.attachments.map((f) => ({ id: f.id, name: f.name, url: f.url, size: f.size }))} /></div>
    </>
  );
}
