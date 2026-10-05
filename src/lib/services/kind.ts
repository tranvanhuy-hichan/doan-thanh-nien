import type { ArticleKind } from "@prisma/client";

/** Slug route quản lý/công khai của từng loại bài (dùng được ở client). */
const SLUG: Record<ArticleKind, string> = { NEWS: "tin-tuc", PLAN: "ke-hoach", EVENT: "su-kien", ANNOUNCEMENT: "thong-bao" };
export const kindSlug = (k: ArticleKind) => SLUG[k];
export const KIND_ACTION: Record<ArticleKind, string> = { NEWS: "Đăng tin", PLAN: "Đăng kế hoạch", EVENT: "Tạo sự kiện", ANNOUNCEMENT: "Đăng thông báo" };
