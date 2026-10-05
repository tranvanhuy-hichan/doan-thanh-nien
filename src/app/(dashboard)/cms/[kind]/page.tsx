import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { CMS_SLUG, KIND_ACTION, KIND_LABEL, articleHref } from "@/lib/services/public";
import { formatDate, pageParam, str } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { CompactList } from "@/components/ui/compact-list";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, EmptyState, PageHeader, Pagination, StatusBadge, Td, Th } from "@/components/ui/misc";
import { ArticleRowActions } from "@/components/cms/row-actions";

const PAGE_SIZE = 12;

export default async function CmsKindPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["ADMIN"]);
  const { kind: slug } = await params;
  const kind = CMS_SLUG[slug];
  if (!kind) notFound();
  const sp = await searchParams;
  const q = str(sp.q);
  const page = pageParam(sp.page);
  const base = `/cms/${slug}`;
  const where: Prisma.ArticleWhereInput = { kind, ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.article.count({ where }),
  ]);
  return (
    <>
      <PageHeader title={KIND_LABEL[kind]} description="Quản lý nội dung hiển thị trên trang công khai"
        actions={<>
          <Link href={`/${slug}`} target="_blank" className={buttonClass("secondary")}><ExternalLink className="size-4" /><span className="max-sm:hidden">Xem trang công khai</span></Link>
          <Link href={`${base}/new`} className={buttonClass()}><Plus className="size-4" />{KIND_ACTION[kind]}</Link>
        </>} />
      <FilterBar fields={[{ type: "search", name: "q", placeholder: "Tìm theo tiêu đề..." }]} />
      {items.length === 0 ? <div className="rounded-lg border border-border bg-white/85"><EmptyState title={`Chưa có ${KIND_LABEL[kind].toLowerCase()}`} description="Nội dung đăng ở đây sẽ hiển thị trên trang công khai." /></div> : (
        <>
          <CompactList items={items.map((a) => ({
            id: a.id, title: a.title, subtitle: formatDate(a.createdAt),
            badge: <StatusBadge tone={a.published ? "green" : "gray"}>{a.published ? "Hiển thị" : "Nháp"}</StatusBadge>,
            href: a.published ? articleHref(a.slug) : undefined, hrefLabel: "Xem bài", actions: <ArticleRowActions id={a.id} published={a.published} base={base} />,
            details: [["Ngày tạo", formatDate(a.createdAt)], ["Trạng thái", a.published ? "Hiển thị công khai" : "Bản nháp"]],
          }))} />
          <div className="max-sm:hidden">
            <DataTable>
              <thead><tr><Th>Tiêu đề</Th><Th>Ngày tạo</Th><Th>Trạng thái</Th><Th /></tr></thead>
              <tbody>{items.map((a) => (
                <tr key={a.id}>
                  <Td className="max-w-lg font-medium">{a.published ? <Link href={articleHref(a.slug)} target="_blank" className="hover:text-primary">{a.title}</Link> : a.title}</Td>
                  <Td className="whitespace-nowrap">{formatDate(a.createdAt)}</Td>
                  <Td><StatusBadge tone={a.published ? "green" : "gray"}>{a.published ? "Hiển thị" : "Nháp"}</StatusBadge></Td>
                  <Td className="text-right whitespace-nowrap"><ArticleRowActions id={a.id} published={a.published} base={base} /></Td>
                </tr>
              ))}</tbody>
            </DataTable>
          </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={base} params={{ q }} />
    </>
  );
}
