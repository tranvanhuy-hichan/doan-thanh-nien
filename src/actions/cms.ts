"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { articleSchema, sitePageSchema } from "@/lib/validation";
import { SITE_PAGES } from "@/lib/services/public";
import { uniqueSlug } from "@/lib/slug";
import { deleteImage, isOwnPublicId } from "@/lib/cloudinary";
import { notifyUsers } from "@/lib/notify";

const refreshPublic = () => revalidatePath("/", "layout");

export async function saveArticleAction(id: string | null, input: unknown) {
  return run<{ id: string }>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const d = articleSchema.parse(input);
    if (d.coverPublicId && !isOwnPublicId(d.coverPublicId, "activities")) throw new UserError("Ảnh không hợp lệ");
    if (d.kind === "EVENT" && !d.eventAt) throw new UserError("Sự kiện cần có thời gian diễn ra");

    const base = {
      kind: d.kind, title: d.title, summary: d.summary ?? null, content: d.content, coverUrl: d.coverUrl ?? null, coverPublicId: d.coverPublicId ?? null,
      eventAt: d.kind === "EVENT" ? d.eventAt ?? null : null, eventLocation: d.kind === "EVENT" ? d.eventLocation ?? null : null, published: d.published,
    };
    if (id) {
      const cur = await db.article.findUnique({ where: { id } });
      if (!cur) throw new UserError("Không tìm thấy bài viết");
      const publishedAt = d.published ? cur.publishedAt ?? new Date() : null;
      await db.article.update({ where: { id }, data: { ...base, publishedAt } });
      if (cur.coverPublicId && cur.coverPublicId !== base.coverPublicId) await deleteImage(cur.coverPublicId);
      await audit(admin.id, "article.update", "Article", id, { title: d.title });
      refreshPublic();
      return { data: { id }, message: "Đã cập nhật bài viết" };
    }
    const a = await db.article.create({ data: { ...base, slug: uniqueSlug(d.title), publishedAt: d.published ? new Date() : null, authorId: admin.id } });
    if (d.published && d.kind === "ANNOUNCEMENT") {
      const users = await db.user.findMany({ where: { status: "ACTIVE", id: { not: admin.id } }, select: { id: true } });
      await notifyUsers(users.map((u) => u.id), { type: "SYSTEM", title: "Thông báo mới từ Đoàn trường", body: d.title, link: `/bai-viet/${a.slug}` });
    }
    await audit(admin.id, "article.create", "Article", a.id, { title: d.title, kind: d.kind });
    refreshPublic();
    return { data: { id: a.id }, message: "Đã đăng bài viết" };
  });
}

export async function setArticlePublishedAction(id: string, published: boolean) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const cur = await db.article.findUnique({ where: { id } });
    if (!cur) throw new UserError("Không tìm thấy bài viết");
    await db.article.update({ where: { id }, data: { published, publishedAt: published ? cur.publishedAt ?? new Date() : cur.publishedAt } });
    await audit(admin.id, published ? "article.publish" : "article.unpublish", "Article", id);
    refreshPublic();
    revalidatePath("/cms/articles");
    return { message: published ? "Đã hiển thị bài viết" : "Đã ẩn bài viết" };
  });
}

export async function deleteArticleAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const cur = await db.article.findUnique({ where: { id } });
    if (!cur) throw new UserError("Không tìm thấy bài viết");
    await db.article.delete({ where: { id } });
    await deleteImage(cur.coverPublicId);
    await audit(admin.id, "article.delete", "Article", id, { title: cur.title });
    refreshPublic();
    revalidatePath("/cms/articles");
    return { message: "Đã xóa bài viết" };
  });
}

export async function saveSitePageAction(slug: string, input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    if (!SITE_PAGES[slug]) throw new UserError("Trang không tồn tại");
    const { content } = sitePageSchema.parse(input);
    await db.sitePage.upsert({ where: { slug }, update: { content, updatedById: admin.id }, create: { slug, title: SITE_PAGES[slug], content, updatedById: admin.id } });
    await audit(admin.id, "sitepage.update", "SitePage", slug);
    refreshPublic();
    return { message: "Đã lưu trang" };
  });
}
