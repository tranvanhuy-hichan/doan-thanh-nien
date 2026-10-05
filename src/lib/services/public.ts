import "server-only";
import type { ArticleKind } from "@prisma/client";
import { db } from "@/lib/db";

export const KIND_LABEL: Record<ArticleKind, string> = { NEWS: "Tin tức", PLAN: "Kế hoạch", EVENT: "Sự kiện", ANNOUNCEMENT: "Thông báo" };
export const KIND_PATH: Record<ArticleKind, string> = { NEWS: "/tin-tuc", PLAN: "/ke-hoach", EVENT: "/su-kien", ANNOUNCEMENT: "/thong-bao" };
export const articleHref = (slug: string) => `/bai-viet/${slug}`;

export const SITE_PAGES: Record<string, string> = {
  "doan-truong": "Đoàn trường",
  "bch-doan-truong": "Ban chấp hành Đoàn trường",
  "co-cau-to-chuc": "Cơ cấu tổ chức",
  "noi-quy": "Nội quy",
};

const publishedWhere = () => ({ published: true, publishedAt: { lte: new Date() } });

export const articleCard = {
  id: true, kind: true, title: true, slug: true, summary: true, coverUrl: true, publishedAt: true, eventAt: true, eventLocation: true,
} as const;

export function latestArticles(kind: ArticleKind, take: number) {
  return db.article.findMany({ where: { kind, ...publishedWhere() }, orderBy: { publishedAt: "desc" }, take, select: articleCard });
}

export async function listArticles(kind: ArticleKind, page: number, size: number) {
  const where = { kind, ...publishedWhere() };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * size, take: size, select: articleCard }),
    db.article.count({ where }),
  ]);
  return { items, total };
}

export const getArticle = (slug: string) => db.article.findFirst({ where: { slug, ...publishedWhere() }, include: { author: { select: { fullName: true } } } });

export const getSitePage = (slug: string) => db.sitePage.findUnique({ where: { slug } });

export function upcomingActivities(take: number) {
  return db.activity.findMany({
    where: { cancelledAt: null, endAt: { gte: new Date() } },
    orderBy: { startAt: "asc" }, take,
    select: { id: true, title: true, startAt: true, endAt: true, location: true, department: { select: { name: true } }, category: { select: { name: true } } },
  });
}

/** Chi đoàn nhóm theo khối (lấy số đầu của tên: 10A1 -> khối 10). */
export async function departmentsByGrade() {
  const depts = await db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, _count: { select: { chapterReports: true } } } });
  const groups = new Map<string, typeof depts>();
  for (const d of depts) {
    const g = d.name.match(/^\d+/)?.[0] ?? "Khác";
    groups.set(g, [...(groups.get(g) ?? []), d]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "vi", { numeric: true }));
}

/** Route quản lý /cms/<slug> <-> loại bài. Trùng slug với đường dẫn công khai (bỏ dấu "/"). */
export const CMS_SLUG: Record<string, ArticleKind> = { "tin-tuc": "NEWS", "ke-hoach": "PLAN", "su-kien": "EVENT", "thong-bao": "ANNOUNCEMENT" };
export { KIND_ACTION } from "./kind";
