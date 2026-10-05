import "server-only";
import { db } from "@/lib/db";

export const SETTING_FIELDS = [
  { key: "bannerUrl", label: "Ảnh banner", default: "", multiline: false },
  { key: "bannerPublicId", label: "Ảnh banner (mã)", default: "", multiline: false },
  { key: "address", label: "Địa chỉ", default: "Xã Sơn Hà, Tỉnh Quảng Ngãi", multiline: false },
  { key: "phone", label: "Số điện thoại liên hệ", default: "", multiline: false },
  { key: "email", label: "Email liên hệ", default: "", multiline: false },
] as const;

export type SiteSettings = Record<(typeof SETTING_FIELDS)[number]["key"], string>;

/** Đọc cài đặt website; trường chưa nhập dùng giá trị mặc định. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.siteSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(SETTING_FIELDS.map((f) => [f.key, map.get(f.key) ?? f.default])) as SiteSettings;
}

export const DEFAULT_MARQUEE = "Chào mừng các bạn đến với website Đoàn trường THPT Sơn Hà";

/** Các dòng chữ chạy đang bật, theo thứ tự; trống thì dùng câu chào mặc định. */
export async function getMarquee(): Promise<{ id: string; text: string; link: string | null }[]> {
  const items = await db.marqueeItem.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, text: true, link: true } });
  return items.length ? items : [{ id: "default", text: DEFAULT_MARQUEE, link: null }];
}
