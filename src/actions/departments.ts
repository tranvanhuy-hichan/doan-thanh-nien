"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { departmentSchema, secretarySchema } from "@/lib/validation";
import { parseClassName, schoolYearStart, startYearFor } from "@/lib/school-year";
import { syncSchoolYear } from "@/lib/services/rollover";
import { createMemberWithAccount, findOrCreateClass, nextMemberCodes } from "@/lib/services/member-account";
import type { Credential } from "@/actions/members";

export async function saveDepartmentAction(id: string | null, input: unknown) {
  return run<{ created?: Credential[] }>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const { startYear: given, members: memberText, ...data } = departmentSchema.parse(input);
    const current = id ? await db.department.findUnique({ where: { id }, select: { startYear: true, graduatedAt: true } }) : null;
    if (current?.graduatedAt) throw new UserError("Chi đoàn đã ra trường, không thể chỉnh sửa");
    // Khóa (năm vào lớp 10): nhập tay, hoặc giữ khóa cũ, hoặc suy ra từ tên khối (10A1 -> năm học hiện tại).
    const p = parseClassName(data.name);
    const startYear = given ?? current?.startYear ?? (p ? startYearFor(p.grade, schoolYearStart()) : null);
    const dup = await db.department.findFirst({ where: { name: data.name, startYear, ...(id ? { NOT: { id } } : {}) } });
    if (dup) throw new UserError("Chi đoàn này (cùng tên, cùng khóa) đã tồn tại");

    if (id) {
      const dept = await db.department.update({ where: { id }, data: { ...data, startYear } });
      await audit(admin.id, "department.update", "Department", dept.id, { name: dept.name });
      revalidatePath("/departments");
      return { message: "Đã cập nhật Chi đoàn" };
    }

    // Tạo mới: nếu có danh sách họ tên thì tự tạo lớp + đoàn viên + tài khoản (mật khẩu tạm hiển thị một lần).
    const names = [...new Set((memberText ?? "").split(/\r?\n/).map((l) => l.trim().replace(/\s+/g, " ")).filter(Boolean))];
    if (names.some((n) => n.length < 2 || n.length > 100)) throw new UserError("Mỗi dòng là một họ tên (2–100 ký tự)");
    if (names.length > 100) throw new UserError("Mỗi lần tạo tối đa 100 đoàn viên, có thể nhập thêm bằng file Excel ở mục Đoàn viên");
    const hashed = await Promise.all(names.map(async () => { const password = generateTempPassword(); return { password, passwordHash: await hashPassword(password) }; }));
    const created: Credential[] = [];
    const dept = await db.$transaction(async (tx) => {
      const d = await tx.department.create({ data: { ...data, startYear } });
      if (names.length) {
        const cls = await findOrCreateClass(tx, d.id, d.name);
        const codes = await nextMemberCodes(tx, new Date().getFullYear(), names.length);
        for (let i = 0; i < names.length; i++) {
          await createMemberWithAccount(tx, { fullName: names[i], departmentId: d.id, classId: cls.id, cohort: startYear }, codes[i], hashed[i]);
          created.push({ code: codes[i], fullName: names[i], className: cls.name, department: d.name, password: hashed[i].password });
        }
      }
      await audit(admin.id, "department.create", "Department", d.id, { name: d.name, members: names.length }, tx);
      return d;
    }, { timeout: 60_000, maxWait: 10_000 });
    revalidatePath("/departments");
    return { data: { created }, message: created.length ? `Đã tạo Chi đoàn ${dept.name} và ${created.length} tài khoản đoàn viên` : "Đã tạo Chi đoàn" };
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

/**
 * Phân công bí thư: chọn một đoàn viên của Chi đoàn, tài khoản đó được gán thêm vai trò bí thư
 * (vẫn là tài khoản đoàn viên, giữ quyền đoàn viên). Bí thư cũ trở lại là đoàn viên thường.
 */
export async function assignSecretaryAction(input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = secretarySchema.parse(input);
    const dept = await db.department.findUnique({ where: { id: data.departmentId } });
    if (!dept || dept.graduatedAt) throw new UserError("Không tìm thấy Chi đoàn");
    const member = await db.member.findFirst({ where: { id: data.memberId, departmentId: dept.id, status: "ACTIVE" }, include: { user: true } });
    if (!member) throw new UserError("Đoàn viên này không thuộc Chi đoàn hoặc không còn sinh hoạt");
    if (member.user.status !== "ACTIVE") throw new UserError("Tài khoản của đoàn viên này đang bị khóa");
    if (member.user.role === "ADMIN") throw new UserError("Không thể gán bí thư cho tài khoản quản trị");
    await db.$transaction([
      ...(dept.secretaryId && dept.secretaryId !== member.userId ? [db.user.updateMany({ where: { id: dept.secretaryId, member: { isNot: null } }, data: { role: "MEMBER" } })] : []),
      db.user.update({ where: { id: member.userId }, data: { role: "SECRETARY" } }),
      db.department.update({ where: { id: dept.id }, data: { secretaryId: member.userId } }),
    ]);
    await audit(admin.id, "department.assign_secretary", "Department", dept.id, { secretaryId: member.userId, memberId: member.id });
    revalidatePath("/departments");
    return { message: `${member.fullName} đã được bầu làm bí thư` };
  });
}

export async function removeSecretaryAction(departmentId: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const dept = await db.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw new UserError("Không tìm thấy Chi đoàn");
    await db.$transaction([
      ...(dept.secretaryId ? [db.user.updateMany({ where: { id: dept.secretaryId, member: { isNot: null } }, data: { role: "MEMBER" } })] : []),
      db.department.update({ where: { id: departmentId }, data: { secretaryId: null } }),
    ]);
    await audit(admin.id, "department.remove_secretary", "Department", departmentId);
    revalidatePath("/departments");
    return { message: "Đã gỡ chức bí thư (vẫn là đoàn viên)" };
  });
}

/** Chuyển năm học thủ công (cron cũng tự chạy mỗi ngày): đổi tên khối, cho khóa lớp 12 ra trường. */
export async function syncSchoolYearAction() {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const r = await syncSchoolYear(admin.id);
    revalidatePath("/", "layout");
    return { message: r.renamed || r.graduated ? `Năm học ${r.schoolYear}–${r.schoolYear + 1}: đổi tên ${r.renamed} Chi đoàn, ${r.graduated} Chi đoàn ra trường` : `Năm học ${r.schoolYear}–${r.schoolYear + 1}: không có thay đổi` };
  });
}
