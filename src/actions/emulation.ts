"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notify";
import { emulationSchema } from "@/lib/validation";

export async function createEmulationRecordAction(input: unknown) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const data = emulationSchema.parse(input);
    const dept = await db.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new UserError("Chi đoàn không tồn tại");
    const rec = await db.emulationRecord.create({ data: { ...data, createdById: admin.id } });
    if (dept.secretaryId) {
      await notifyUser(dept.secretaryId, {
        type: "POINTS", title: `Chi đoàn ${dept.name} ${data.points > 0 ? "được cộng" : "bị trừ"} ${Math.abs(data.points)} điểm thi đua`, body: data.reason, link: "/emulation",
      });
    }
    await audit(admin.id, "emulation.create", "Department", dept.id, { recordId: rec.id, points: data.points, reason: data.reason });
    revalidatePath("/emulation");
    return { message: "Đã ghi nhận điểm thi đua" };
  });
}

export async function deleteEmulationRecordAction(id: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    const rec = await db.emulationRecord.findUnique({ where: { id } });
    if (!rec) throw new UserError("Không tìm thấy bản ghi");
    await db.emulationRecord.delete({ where: { id } });
    await audit(admin.id, "emulation.delete", "Department", rec.departmentId, { recordId: id, points: rec.points, reason: rec.reason });
    revalidatePath("/emulation");
    return { message: "Đã xóa bản ghi" };
  });
}
