"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { badgeSchema, categorySchema } from "@/lib/validation";
import { evaluateBadges } from "@/lib/services/badges";

export async function saveCategoryAction(id: string | null, input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = categorySchema.parse(input);
    const dup = await db.activityCategory.findFirst({ where: { name: data.name, ...(id ? { NOT: { id } } : {}) } });
    if (dup) throw new UserError("Loại hoạt động đã tồn tại");
    const c = id ? await db.activityCategory.update({ where: { id }, data }) : await db.activityCategory.create({ data });
    await audit(admin.id, id ? "category.update" : "category.create", "ActivityCategory", c.id, data);
    revalidatePath("/settings");
    return { message: "Đã lưu loại hoạt động" };
  });
}

export async function deleteCategoryAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    if (await db.activity.count({ where: { categoryId: id } })) throw new UserError("Loại này đang được dùng bởi hoạt động, không thể xóa");
    await db.activityCategory.delete({ where: { id } });
    await audit(admin.id, "category.delete", "ActivityCategory", id);
    revalidatePath("/settings");
    return { message: "Đã xóa loại hoạt động" };
  });
}

export async function saveBadgeAction(id: string | null, input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = badgeSchema.parse(input);
    if (data.criteria === "CATEGORY_COUNT" && !data.categoryId) throw new UserError("Chọn loại hoạt động cho điều kiện này");
    const dup = await db.badge.findFirst({ where: { name: data.name, ...(id ? { NOT: { id } } : {}) } });
    if (dup) throw new UserError("Tên huy hiệu đã tồn tại");
    const payload = { ...data, categoryId: data.criteria === "CATEGORY_COUNT" ? data.categoryId! : null };
    const b = id ? await db.badge.update({ where: { id }, data: payload }) : await db.badge.create({ data: payload });
    // Trao huy hiệu cho những đoàn viên đã đủ điều kiện.
    const members = await db.member.findMany({ select: { id: true } });
    for (const m of members) await db.$transaction((tx) => evaluateBadges(tx, m.id));
    await audit(admin.id, id ? "badge.update" : "badge.create", "Badge", b.id, { name: b.name });
    revalidatePath("/achievements");
    return { message: "Đã lưu huy hiệu" };
  });
}

export async function deleteBadgeAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    await db.badge.delete({ where: { id } });
    await audit(admin.id, "badge.delete", "Badge", id);
    revalidatePath("/achievements");
    return { message: "Đã xóa huy hiệu" };
  });
}
