import Link from "next/link";
import { ClickRow } from "@/components/ui/click-row";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { CMS_SLUG, KIND_ACTION, KIND_LABEL } from "@/lib/services/public";
import { formatDate, pageParam, str } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { CompactList } from "@/components/ui/compact-list";
import { FilterBar } from "@/components/ui/filter-bar";
import { DataTable, EmptyState, PageHeader, Pagination, StatusBadge, Td, Th } from "@/components/ui/misc";
import { ArticleRowActions, ArticleStatus } from "@/components/cms/row-actions";

const PAGE_SIZE = 12;

export default async function CmsKindPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const isAdmin = user.role === "ADMIN";
  const { kind: slug } = await params;
  const kind = CMS_SLUG[slug];
  if (!kind) notFound();
  const sp = await searchParams;
  const q = str(sp.q);
  const page = pageParam(sp.page);
  const base = `/cms/${slug}`;
  const where: Prisma.ArticleWhereInput = { kind, ...(isAdmin ? {} : { authorId: user.id }), ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { author: { select: { fullName: true, role: true } } } }),
    db.article.count({ where }),
  ]);
  return (
    <>
      <PageHeader title={KIND_LABEL[kind]} description={isAdmin ? "Quản lý nội dung hiển thị trên trang công khai" : "Bài của bạn được lưu ở dạng nháp, Admin duyệt rồi mới hiển thị công khai"}
        actions={<>
          {isAdmin && <Link href={`/${slug}`} target="_blank" className={buttonClass("secondary")}><ExternalLink className="size-4" /><span className="max-sm:hidden">Xem trang công khai</span></Link>}
          <Link href={`${base}/new`} className={buttonClass()}><Plus className="size-4" />{KIND_ACTION[kind]}</Link>
        </>} />
      <FilterBar fields={[{ type: "search", name: "q", placeholder: "Tìm theo tiêu đề..." }]} />
      {items.length === 0 ? <div className="rounded-lg border border-border bg-white/85"><EmptyState title={`Chưa có ${KIND_LABEL[kind].toLowerCase()}`} description="Nội dung đăng ở đây sẽ hiển thị trên trang công khai." /></div> : (
        <>
          <CompactList items={items.map((a) => ({
            id: a.id, title: a.title, subtitle: isAdmin && a.author?.role === "SECRETARY" ? `${formatDate(a.createdAt)} · ${(a.author?.fullName ?? "—")}` : formatDate(a.createdAt),
            badge: <ArticleStatus published={a.published} pending={!a.published && a.author?.role === "SECRETARY"} />,
            href: `${base}/${a.id}`,
          }))} />
          <div className="max-sm:hidden">
            <DataTable>
              <thead><tr><Th>Tiêu đề</Th><Th>Người đăng</Th><Th>Ngày tạo</Th><Th>Trạng thái</Th><Th /></tr></thead>
              <tbody>{items.map((a) => (
                <ClickRow key={a.id} href={`${base}/${a.id}`}>
                  <Td className="max-w-lg font-medium"><Link href={`${base}/${a.id}`} className="hover:text-primary">{a.title}</Link></Td>
                  <Td className="whitespace-nowrap">{(a.author?.fullName ?? "—")}</Td>
                  <Td className="whitespace-nowrap">{formatDate(a.createdAt)}</Td>
                  <Td><ArticleStatus published={a.published} pending={!a.published && a.author?.role === "SECRETARY"} /></Td>
                  <Td className="text-right whitespace-nowrap">{(isAdmin || !a.published) && <ArticleRowActions id={a.id} published={a.published} base={base} ownerOnly={!isAdmin} />}</Td>
                </ClickRow>
              ))}</tbody>
            </DataTable>
          </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath={base} params={{ q }} />
    </>
  );
}
