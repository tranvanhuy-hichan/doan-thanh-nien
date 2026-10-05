import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import type { ArticleKind, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { KIND_LABEL, articleHref } from "@/lib/services/public";
import { formatDate, pageParam, str } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { CompactList } from "@/components/ui/compact-list";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, EmptyState, PageHeader, Pagination, StatusBadge, Td, Th } from "@/components/ui/misc";
import { ArticleRowActions } from "@/components/cms/row-actions";

export const metadata = { title: "Quản lý bài viết" };
const PAGE_SIZE = 12;

export default async function CmsArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const q = str(sp.q), kind = str(sp.kind) as ArticleKind | undefined;
  const page = pageParam(sp.page);
  const where: Prisma.ArticleWhereInput = { ...(kind && kind in KIND_LABEL ? { kind } : {}), ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.article.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Website công khai" description="Quản lý tin tức, kế hoạch, sự kiện, thông báo"
        actions={<>
          <Link href="/" target="_blank" className={buttonClass("secondary")}><ExternalLink className="size-4" />Xem trang<span className="max-sm:hidden"> công khai</span></Link>
          <Link href="/cms/pages" className={buttonClass("secondary")}>Trang giới thiệu</Link>
          <Link href="/cms/articles/new" className={buttonClass()}><Plus className="size-4" />Đăng bài</Link>
        </>} />
      <FilterBar fields={[
        { type: "search", name: "q", placeholder: "Tìm theo tiêu đề..." },
        { type: "select", name: "kind", label: "Loại bài", options: Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label })) },
      ]} />
      {items.length === 0 ? <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có bài viết" description="Đăng bài đầu tiên để hiển thị trên trang công khai." /></div> : (
        <>
          <CompactList items={items.map((a) => ({
            id: a.id, title: a.title, subtitle: `${KIND_LABEL[a.kind]} · ${formatDate(a.createdAt)}`,
            badge: <StatusBadge tone={a.published ? "green" : "gray"}>{a.published ? "Hiển thị" : "Nháp"}</StatusBadge>,
            href: a.published ? articleHref(a.slug) : undefined, hrefLabel: "Xem bài", actions: <ArticleRowActions id={a.id} published={a.published} />,
            details: [["Loại", KIND_LABEL[a.kind]], ["Ngày tạo", formatDate(a.createdAt)], ["Trạng thái", a.published ? "Hiển thị công khai" : "Bản nháp"]],
          }))} />
          <div className="max-sm:hidden">
            <DataTable>
              <thead><tr><Th>Tiêu đề</Th><Th>Loại</Th><Th>Ngày tạo</Th><Th>Trạng thái</Th><Th /></tr></thead>
              <tbody>{items.map((a) => (
                <tr key={a.id}>
                  <Td className="max-w-md font-medium">{a.published ? <Link href={articleHref(a.slug)} target="_blank" className="hover:text-primary">{a.title}</Link> : a.title}</Td>
                  <Td>{KIND_LABEL[a.kind]}</Td><Td className="whitespace-nowrap">{formatDate(a.createdAt)}</Td>
                  <Td><StatusBadge tone={a.published ? "green" : "gray"}>{a.published ? "Hiển thị" : "Nháp"}</StatusBadge></Td>
                  <Td className="text-right whitespace-nowrap"><ArticleRowActions id={a.id} published={a.published} /></Td>
                </tr>
              ))}</tbody>
            </DataTable>
          </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/cms/articles" params={{ q, kind }} />
    </>
  );
}
