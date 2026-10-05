"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { departmentSchema, secretarySchema } from "@/lib/validation";

export async function saveDepartmentAction(id: string | null, input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = departmentSchema.parse(input);
    const dup = await db.department.findFirst({ where: { name: data.name, ...(id ? { NOT: { id } } : {}) } });
    if (dup) throw new UserError("Tên Chi đoàn đã tồn tại");
    const dept = id
      ? await db.department.update({ where: { id }, data })
      : await db.department.create({ data });
    await audit(admin.id, id ? "department.update" : "department.create", "Department", dept.id, { name: dept.name });
    revalidatePath("/departments");
    return { message: id ? "Đã cập nhật Chi đoàn" : "Đã tạo Chi đoàn" };
  });
}

export async function deleteDepartmentAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const dept = await db.department.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
    if (!dept) throw new UserError("Không tìm thấy Chi đoàn");
    if (dept._count.members > 0) throw new UserError("Chi đoàn còn đoàn viên, hãy chuyển đoàn viên sang Chi đoàn khác trước khi xóa");
    await db.department.delete({ where: { id } });
    await audit(admin.id, "department.delete", "Department", id, { name: dept.name });
    revalidatePath("/departments");
    return { message: "Đã xóa Chi đoàn" };
  });
}

/** Phân công bí thư: chọn tài khoản bí thư có sẵn hoặc tạo mới (trả về mật khẩu tạm thời một lần). */
export async function assignSecretaryAction(input: unknown) {
  return run<{ username?: string; tempPassword?: string }>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = secretarySchema.parse(input);
    const dept = await db.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new UserError("Không tìm thấy Chi đoàn");

    let userId: string;
    let created: { username: string; tempPassword: string } | undefined;
    if (data.mode === "existing") {
      if (!data.userId) throw new UserError("Chọn bí thư");
      const u = await db.user.findFirst({ where: { id: data.userId, role: "SECRETARY" }, include: { secretaryOf: true } });
      if (!u) throw new UserError("Không tìm thấy tài khoản bí thư");
      if (u.secretaryOf && u.secretaryOf.id !== dept.id) throw new UserError(`Bí thư này đang phụ trách Chi đoàn ${u.secretaryOf.name}`);
      userId = u.id;
    } else {
      if (!data.username || !data.fullName) throw new UserError("Nhập tên đăng nhập và họ tên bí thư");
      if (await db.user.findUnique({ where: { username: data.username } })) throw new UserError("Tên đăng nhập đã tồn tại");
      const tempPassword = generateTempPassword();
      const u = await db.user.create({
        data: { username: data.username, fullName: data.fullName, role: "SECRETARY", passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
      });
      userId = u.id;
      created = { username: u.username, tempPassword };
    }
    await db.department.update({ where: { id: dept.id }, data: { secretaryId: userId } });
    await audit(admin.id, "department.assign_secretary", "Department", dept.id, { secretaryId: userId });
    revalidatePath("/departments");
    return { data: created, message: "Đã phân công bí thư" };
  });
}

export async function removeSecretaryAction(departmentId: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    await db.department.update({ where: { id: departmentId }, data: { secretaryId: null } });
    await audit(admin.id, "department.remove_secretary", "Department", departmentId);
    revalidatePath("/departments");
    return { message: "Đã gỡ bí thư" };
  });
}
