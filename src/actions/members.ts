"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth/session";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { memberSchema, pointAdjustSchema } from "@/lib/validation";
import { createMemberWithAccount, findOrCreateClass, nextMemberCodes } from "@/lib/services/member-account";
import { evaluateBadges } from "@/lib/services/badges";
import { notifyUser } from "@/lib/notify";
import { deleteImage, isOwnPublicId } from "@/lib/cloudinary";

export type Credential = { code: string; fullName: string; className: string; department: string; password: string };
export type ImportResult = { created: Credential[]; errors: { row: number; message: string }[] };

async function resolveClass(departmentId: string, className: string) {
  const dept = await db.department.findUnique({ where: { id: departmentId } });
  if (!dept) throw new UserError("Chi đoàn không tồn tại");
  return findOrCreateClass(db, departmentId, className);
}

export async function createMemberAction(input: unknown) {
  return run<Credential>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const { className, ...data } = memberSchema.parse(input);
    if (data.avatarPublicId && !isOwnPublicId(data.avatarPublicId, "members")) throw new UserError("Ảnh không hợp lệ");
    const cls = await resolveClass(data.departmentId, className);
    const year = data.joinedAt?.getFullYear() ?? new Date().getFullYear();
    const result = await db.$transaction(async (tx) => {
      const [code] = await nextMemberCodes(tx, year, 1);
      return { code, ...(await createMemberWithAccount(tx, { ...data, classId: cls.id }, code)) };
    });
    await audit(admin.id, "member.create", "Member", result.member.id, { code: result.code });
    revalidatePath("/members");
    return {
      data: { code: result.code, fullName: data.fullName, className, department: "", password: result.tempPassword },
      message: "Đã thêm đoàn viên và tạo tài khoản",
    };
  });
}

export async function updateMemberAction(id: string, input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const { className, ...data } = memberSchema.parse(input);
    const current = await db.member.findUnique({ where: { id } });
    if (!current) throw new UserError("Không tìm thấy đoàn viên");
    if (data.avatarPublicId && data.avatarPublicId !== current.avatarPublicId && !isOwnPublicId(data.avatarPublicId, "members")) {
      throw new UserError("Ảnh không hợp lệ");
    }
    const cls = await resolveClass(data.departmentId, className);
    await db.$transaction([
      db.member.update({ where: { id }, data: { ...data, avatarUrl: data.avatarUrl ?? null, avatarPublicId: data.avatarPublicId ?? null, classId: cls.id } }),
      db.user.update({ where: { id: current.userId }, data: { fullName: data.fullName } }),
    ]);
    if (current.avatarPublicId && current.avatarPublicId !== data.avatarPublicId) await deleteImage(current.avatarPublicId);
    await audit(admin.id, "member.update", "Member", id, { code: current.code });
    revalidatePath("/members");
    revalidatePath(`/members/${id}`);
    return { message: "Đã cập nhật đoàn viên" };
  });
}

export async function setMemberAccountStatusAction(id: string, status: "ACTIVE" | "LOCKED") {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const m = await db.member.findUnique({ where: { id } });
    if (!m) throw new UserError("Không tìm thấy đoàn viên");
    await db.user.update({ where: { id: m.userId }, data: { status } });
    await audit(admin.id, status === "LOCKED" ? "account.lock" : "account.unlock", "User", m.userId, { code: m.code });
    revalidatePath("/members");
    revalidatePath(`/members/${id}`);
    return { message: status === "LOCKED" ? "Đã khóa tài khoản" : "Đã kích hoạt tài khoản" };
  });
}

export async function resetMemberPasswordAction(id: string) {
  return run<{ password: string }>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const m = await db.member.findUnique({ where: { id } });
    if (!m) throw new UserError("Không tìm thấy đoàn viên");
    const password = generateTempPassword();
    await db.user.update({ where: { id: m.userId }, data: { passwordHash: await hashPassword(password), mustChangePassword: true } });
    await audit(admin.id, "account.reset_password", "User", m.userId, { code: m.code });
    return { data: { password }, message: "Đã cấp lại mật khẩu tạm thời" };
  });
}

export async function deleteMemberAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const m = await db.member.findUnique({ where: { id } });
    if (!m) throw new UserError("Không tìm thấy đoàn viên");
    await db.user.delete({ where: { id: m.userId } }); // cascade -> Member, Attendance, Points...
    await deleteImage(m.avatarPublicId);
    await audit(admin.id, "member.delete", "Member", id, { code: m.code, fullName: m.fullName });
    revalidatePath("/members");
    return { message: "Đã xóa đoàn viên" };
  });
}

export async function adjustPointsAction(input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = pointAdjustSchema.parse(input);
    await db.$transaction(async (tx) => {
      const m = await tx.member.findUnique({ where: { id: data.memberId } });
      if (!m) throw new UserError("Không tìm thấy đoàn viên");
      if (m.totalPoints + data.points < 0) throw new UserError("Tổng điểm không thể âm");
      await tx.pointTransaction.create({ data: { memberId: m.id, type: "ADJUSTMENT", points: data.points, reason: data.reason, createdById: admin.id } });
      await tx.member.update({ where: { id: m.id }, data: { totalPoints: { increment: data.points } } });
      await notifyUser(m.userId, { type: "POINTS", title: `${data.points > 0 ? "Được cộng" : "Bị trừ"} ${Math.abs(data.points)} điểm`, body: data.reason, link: "/history" }, tx);
      await evaluateBadges(tx, m.id);
      await audit(admin.id, "points.adjust", "Member", m.id, { points: data.points, reason: data.reason }, tx);
    });
    revalidatePath(`/members/${data.memberId}`);
    return { message: "Đã điều chỉnh điểm" };
  });
}

/** Đoàn viên tự cập nhật ảnh đại diện. */
export async function updateOwnAvatarAction(input: { avatarUrl: string; avatarPublicId: string }) {
  return run(async () => {
    const user = await requireUser();
    if (!user.memberId) throw new UserError("Chỉ đoàn viên mới có ảnh đại diện");
    if (!isOwnPublicId(input.avatarPublicId, "members") || !input.avatarUrl.startsWith("https://res.cloudinary.com/")) throw new UserError("Ảnh không hợp lệ");
    const m = await db.member.findUniqueOrThrow({ where: { id: user.memberId } });
    await db.member.update({ where: { id: m.id }, data: { avatarUrl: input.avatarUrl, avatarPublicId: input.avatarPublicId } });
    await deleteImage(m.avatarPublicId);
    revalidatePath("/profile");
    return { message: "Đã cập nhật ảnh" };
  });
}

// ---------- Import Excel ----------

const HEADERS = ["Họ tên", "Ngày sinh", "Giới tính", "Lớp", "Chi đoàn", "Khóa", "Ngày vào Đoàn"] as const;
const MAX_IMPORT_ROWS = 500;

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if ("text" in v) return String(v.text);
    if ("result" in v) return String(v.result ?? "");
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
  }
  return String(v).trim();
}

function parseDate(v: ExcelJS.CellValue): Date | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date) return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), 12));
  const m = String(v).trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], 12));
    if (d.getUTCMonth() === +m[2] - 1) return d;
  }
  const iso = new Date(String(v));
  return Number.isNaN(iso.getTime()) ? undefined : iso;
}

export async function importMembersAction(formData: FormData) {
  return run<ImportResult>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new UserError("Vui lòng chọn file Excel (.xlsx)");
    if (!file.name.toLowerCase().endsWith(".xlsx")) throw new UserError("Chỉ hỗ trợ file .xlsx");
    if (file.size > 4 * 1024 * 1024) throw new UserError("File tối đa 4MB");

    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ArrayBuffer);
    } catch {
      throw new UserError("Không đọc được file Excel");
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new UserError("File không có dữ liệu");

    const headerRow = ws.getRow(1);
    const col: Record<string, number> = {};
    headerRow.eachCell((cell, n) => { col[cellText(cell.value).toLowerCase()] = n; });
    for (const h of ["Họ tên", "Lớp"]) {
      if (!col[h.toLowerCase()]) throw new UserError(`Thiếu cột "${h}". Hãy dùng file mẫu.`);
    }
    const get = (row: ExcelJS.Row, h: (typeof HEADERS)[number]) => (col[h.toLowerCase()] ? row.getCell(col[h.toLowerCase()]).value : null);

    const departments = await db.department.findMany();
    const deptByName = new Map(departments.map((d) => [d.name.toLowerCase(), d]));

    type Prepared = { row: number; data: Parameters<typeof createMemberWithAccount>[1]; className: string; deptName: string; joinYear: number };
    const prepared: Prepared[] = [];
    const errors: ImportResult["errors"] = [];
    const total = ws.actualRowCount - 1;
    if (total > MAX_IMPORT_ROWS) throw new UserError(`Mỗi lần nhập tối đa ${MAX_IMPORT_ROWS} đoàn viên`);

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const fullName = cellText(get(row, "Họ tên"));
      const className = cellText(get(row, "Lớp"));
      if (!fullName && !className) continue; // dòng trống
      if (fullName.length < 2) { errors.push({ row: r, message: "Thiếu họ tên" }); continue; }
      if (!className) { errors.push({ row: r, message: "Thiếu lớp" }); continue; }
      const deptName = cellText(get(row, "Chi đoàn")) || className;
      const dept = deptByName.get(deptName.toLowerCase());
      if (!dept) { errors.push({ row: r, message: `Chi đoàn "${deptName}" chưa tồn tại` }); continue; }

      const dobRaw = get(row, "Ngày sinh");
      const dob = parseDate(dobRaw);
      if (dobRaw && !dob) { errors.push({ row: r, message: "Ngày sinh không hợp lệ (dd/mm/yyyy)" }); continue; }
      const joinedRaw = get(row, "Ngày vào Đoàn");
      const joined = parseDate(joinedRaw);
      if (joinedRaw && !joined) { errors.push({ row: r, message: "Ngày vào Đoàn không hợp lệ (dd/mm/yyyy)" }); continue; }
      const genderText = cellText(get(row, "Giới tính"));
      const gender = ["Nam", "Nữ", "Khác"].find((g) => g.toLowerCase() === genderText.toLowerCase());
      const cohortNum = parseInt(cellText(get(row, "Khóa")), 10);

      prepared.push({
        row: r, className, deptName: dept.name, joinYear: joined?.getUTCFullYear() ?? new Date().getFullYear(),
        data: {
          fullName, gender: gender ?? null, dateOfBirth: dob, joinedAt: joined,
          cohort: Number.isNaN(cohortNum) ? null : cohortNum, departmentId: dept.id, classId: "",
        },
      });
    }
    if (!prepared.length && !errors.length) throw new UserError("File không có dòng dữ liệu nào");

    // Băm mật khẩu trước, ngoài transaction, để transaction ngắn.
    const hashed = await Promise.all(prepared.map(async () => {
      const password = generateTempPassword();
      return { password, passwordHash: await hashPassword(password) };
    }));

    const created: Credential[] = [];
    if (prepared.length) {
      await db.$transaction(async (tx) => {
        const codeCounters = new Map<number, string[]>();
        for (const year of new Set(prepared.map((p) => p.joinYear))) {
          codeCounters.set(year, await nextMemberCodes(tx, year, prepared.filter((p) => p.joinYear === year).length));
        }
        for (let i = 0; i < prepared.length; i++) {
          const p = prepared[i];
          const cls = await findOrCreateClass(tx, p.data.departmentId, p.className);
          const code = codeCounters.get(p.joinYear)!.shift()!;
          await createMemberWithAccount(tx, { ...p.data, classId: cls.id }, code, hashed[i]);
          created.push({ code, fullName: p.data.fullName, className: p.className, department: p.deptName, password: hashed[i].password });
        }
        await audit(admin.id, "member.import", "Member", null, { created: created.length, errors: errors.length }, tx);
      }, { timeout: 60_000, maxWait: 10_000 });
    }
    revalidatePath("/members");
    return { data: { created, errors }, message: created.length ? `Đã nhập ${created.length} đoàn viên` : undefined };
  });
}
