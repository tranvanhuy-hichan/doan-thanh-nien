"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { articleSchema, sitePageSchema } from "@/lib/validation";
import { SITE_PAGES } from "@/lib/services/public";
import { uniqueSlug } from "@/lib/slug";
import { deleteImage, isOwnPublicId } from "@/lib/cloudinary";
import { notifyUsers } from "@/lib/notify";
import { kindSlug } from "@/lib/services/kind";
import { cleanContent, cleanHtml } from "@/lib/sanitize";

const refreshPublic = () => revalidatePath("/", "layout");

export async function saveArticleAction(id: string | null, input: unknown) {
  return run<{ id: string }>(async () => {
    const admin = await requireRole(["ADMIN", "SECRETARY"]);
    const isSec = admin.role === "SECRETARY"; // Bí thư chỉ lưu bản nháp của chính mình, Admin duyệt rồi mới đăng
    const d = articleSchema.parse(input);
    d.content = cleanContent(d.content);
    if (isSec) d.published = false;
    if (d.coverPublicId && !isOwnPublicId(d.coverPublicId, "activities")) throw new UserError("Ảnh không hợp lệ");
    if (d.kind === "EVENT" && !d.eventAt) throw new UserError("Sự kiện cần có thời gian diễn ra");
    for (const f of d.attachments) {
      if (!isOwnPublicId(f.publicId, "documents") || !f.url.startsWith("https://res.cloudinary.com/")) throw new UserError("Tệp đính kèm không hợp lệ");
    }

    const base = {
      kind: d.kind, title: d.title, summary: d.summary ?? null, content: d.content, coverUrl: d.coverUrl ?? null, coverPublicId: d.coverPublicId ?? null,
      eventAt: d.kind === "EVENT" ? d.eventAt ?? null : null, eventLocation: d.kind === "EVENT" ? d.eventLocation ?? null : null, published: d.published,
    };
    if (id) {
      const cur = await db.article.findUnique({ where: { id } });
      if (!cur) throw new UserError("Không tìm thấy bài viết");
      if (isSec && (cur.authorId !== admin.id || cur.published || cur.kind !== d.kind)) throw new UserError("Bạn chỉ sửa được bản nháp của mình");
      const publishedAt = d.published ? cur.publishedAt ?? new Date() : null;
      const existing = await db.articleAttachment.findMany({ where: { articleId: id } });
      const keep = new Set(d.attachments.map((f) => f.publicId));
      const removed = existing.filter((f) => !keep.has(f.publicId));
      const known = new Set(existing.map((f) => f.publicId));
      await db.$transaction([
        db.article.update({ where: { id }, data: { ...base, publishedAt } }),
        db.articleAttachment.deleteMany({ where: { id: { in: removed.map((f) => f.id) } } }),
        db.articleAttachment.createMany({ data: d.attachments.filter((f) => !known.has(f.publicId)).map((f) => ({ ...f, articleId: id })) }),
      ]);
      for (const f of removed) await deleteImage(f.publicId);
      if (cur.coverPublicId && cur.coverPublicId !== base.coverPublicId) await deleteImage(cur.coverPublicId);
      await audit(admin.id, "article.update", "Article", id, { title: d.title });
      refreshPublic();
      return { data: { id }, message: isSec ? "Đã lưu bản nháp" : "Đã cập nhật bài viết" };
    }
    const a = await db.article.create({ data: { ...base, slug: uniqueSlug(d.title), publishedAt: d.published ? new Date() : null, authorId: admin.id, attachments: { create: d.attachments } } });
    if (d.published && d.kind === "ANNOUNCEMENT") {
      const users = await db.user.findMany({ where: { status: "ACTIVE", id: { not: admin.id } }, select: { id: true } });
      await notifyUsers(users.map((u) => u.id), { type: "SYSTEM", title: "Thông báo mới từ Đoàn trường", body: d.title, link: `/bai-viet/${a.slug}` });
    }
    await audit(admin.id, "article.create", "Article", a.id, { title: d.title, kind: d.kind });
    if (isSec) {
      const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
      await notifyUsers(admins.map((u) => u.id), { type: "SYSTEM", title: "Bài viết chờ duyệt", body: `${admin.fullName}: ${d.title}`, link: `/cms/${kindSlug(d.kind)}/${a.id}` });
    }
    refreshPublic();
    return { data: { id: a.id }, message: isSec ? "Đã lưu bản nháp, chờ Admin duyệt" : "Đã đăng bài viết" };
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
    revalidatePath("/cms", "layout");
    return { message: published ? "Đã hiển thị bài viết" : "Đã ẩn bài viết" };
  });
}

export async function deleteArticleAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN", "SECRETARY"]);
    const cur = await db.article.findUnique({ where: { id }, include: { attachments: true } });
    if (!cur) throw new UserError("Không tìm thấy bài viết");
    if (admin.role === "SECRETARY" && (cur.authorId !== admin.id || cur.published)) throw new UserError("Bạn chỉ xóa được bản nháp của mình");
    await db.article.delete({ where: { id } });
    await deleteImage(cur.coverPublicId);
    for (const f of cur.attachments) await deleteImage(f.publicId);
    await audit(admin.id, "article.delete", "Article", id, { title: cur.title });
    refreshPublic();
    revalidatePath("/cms", "layout");
    return { message: "Đã xóa bài viết" };
  });
}

export async function saveSitePageAction(slug: string, input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    if (!SITE_PAGES[slug]) throw new UserError("Trang không tồn tại");
    const { content: raw } = sitePageSchema.parse(input);
    const content = cleanHtml(raw);
    await db.sitePage.upsert({ where: { slug }, update: { content, updatedById: admin.id }, create: { slug, title: SITE_PAGES[slug], content, updatedById: admin.id } });
    await audit(admin.id, "sitepage.update", "SitePage", slug);
    refreshPublic();
    return { message: "Đã lưu trang" };
  });
}

export async function saveSiteSettingsAction(input: Record<string, string>) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const { SETTING_FIELDS, getSiteSettings } = await import("@/lib/services/site-settings");
    const before = await getSiteSettings();
    const newBanner = String(input.bannerPublicId ?? "");
    if (newBanner && (!isOwnPublicId(newBanner, "activities") || !String(input.bannerUrl ?? "").startsWith("https://res.cloudinary.com/"))) throw new UserError("Ảnh banner không hợp lệ");
    for (const f of SETTING_FIELDS) {
      const value = String(input[f.key] ?? "").trim().slice(0, 1000);
      if ((f.key === "facebook" || f.key === "youtube") && value && !/^https?:\/\//.test(value)) throw new UserError(`${f.label} phải bắt đầu bằng https://`);
      if (f.key === "countdownLink" && value && !(value.startsWith("/") || /^https?:\/\//.test(value))) throw new UserError("Liên kết phải bắt đầu bằng / hoặc https://");
      if (f.key === "countdownAt" && value && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new UserError("Thời điểm đếm ngược không hợp lệ");
      await db.siteSetting.upsert({ where: { key: f.key }, update: { value }, create: { key: f.key, value } });
    }
    if (before.bannerPublicId && before.bannerPublicId !== newBanner) await deleteImage(before.bannerPublicId);
    await audit(admin.id, "site.settings", "SiteSetting", null);
    refreshPublic();
    return { message: "Đã lưu thông tin website" };
  });
}

// ---------- Dòng chữ chạy ----------

const marqueeSchema = z.object({
  text: z.string().trim().min(2, "Nhập nội dung (tối thiểu 2 ký tự)").max(300, "Tối đa 300 ký tự"),
  link: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(300).refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Liên kết phải bắt đầu bằng / hoặc https://").optional()),
});

export async function addMarqueeAction(input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const d = marqueeSchema.parse(input);
    const last = await db.marqueeItem.aggregate({ _max: { sortOrder: true } });
    await db.marqueeItem.create({ data: { text: d.text, link: d.link ?? null, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    await audit(admin.id, "marquee.create", "MarqueeItem", null, { text: d.text });
    refreshPublic(); revalidatePath("/cms/marquee");
    return { message: "Đã thêm dòng chữ chạy" };
  });
}

export async function toggleMarqueeAction(id: string, active: boolean) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    await db.marqueeItem.update({ where: { id }, data: { active } });
    await audit(admin.id, active ? "marquee.enable" : "marquee.disable", "MarqueeItem", id);
    refreshPublic(); revalidatePath("/cms/marquee");
    return { message: active ? "Đã bật" : "Đã tắt" };
  });
}

export async function deleteMarqueeAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    await db.marqueeItem.delete({ where: { id } });
    await audit(admin.id, "marquee.delete", "MarqueeItem", id);
    refreshPublic(); revalidatePath("/cms/marquee");
    return { message: "Đã xóa" };
  });
}

/** Đổi vị trí với dòng liền kề (hoán đổi sortOrder). */
export async function moveMarqueeAction(id: string, dir: "up" | "down") {
  return run(async () => {
    await requireRole(["ADMIN"]);
    const items = await db.marqueeItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    const i = items.findIndex((x) => x.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= items.length) return;
    const reordered = [...items];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    await db.$transaction(reordered.map((x, idx) => db.marqueeItem.update({ where: { id: x.id }, data: { sortOrder: idx } })));
    refreshPublic(); revalidatePath("/cms/marquee");
  });
}
