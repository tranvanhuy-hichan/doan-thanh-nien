"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth/session";
import { notifyUsers } from "@/lib/notify";

const pollSchema = z.object({
  question: z.string().trim().min(5, "Nhập câu hỏi (tối thiểu 5 ký tự)").max(200),
  description: z.string().trim().max(500).optional(),
  multiple: z.boolean(),
  closesAt: z.string().optional(),
  options: z.array(z.string().trim().min(1).max(120)).min(2, "Cần ít nhất 2 lựa chọn").max(10, "Tối đa 10 lựa chọn"),
});

export async function createPollAction(input: unknown) {
  return run<{ id: string }>(async () => {
    const admin = await requireRole(["ADMIN"]);
    const d = pollSchema.parse(input);
    const options = [...new Set(d.options.map((o) => o.trim()).filter(Boolean))];
    if (options.length < 2) throw new UserError("Cần ít nhất 2 lựa chọn khác nhau");
    const closesAt = d.closesAt ? new Date(d.closesAt) : null;
    if (closesAt && (Number.isNaN(closesAt.getTime()) || closesAt <= new Date())) throw new UserError("Hạn bình chọn phải ở tương lai");
    const poll = await db.poll.create({
      data: { question: d.question, description: d.description || null, multiple: d.multiple, closesAt, createdById: admin.id, options: { create: options.map((text, i) => ({ text, sortOrder: i })) } },
    });
    const users = await db.user.findMany({ where: { status: "ACTIVE", id: { not: admin.id } }, select: { id: true } });
    await notifyUsers(users.map((u) => u.id), { type: "POLL", title: "Bình chọn mới", body: d.question, link: "/polls" });
    await audit(admin.id, "poll.create", "Poll", poll.id, { question: d.question });
    revalidatePath("/polls");
    return { data: { id: poll.id }, message: "Đã tạo bình chọn" };
  });
}

/** Bỏ phiếu (hoặc đổi lựa chọn): mỗi người một bộ phiếu cho mỗi cuộc bình chọn. */
export async function votePollAction(pollId: string, optionIds: string[]) {
  return run(async () => {
    const user = await requireUser();
    const poll = await db.poll.findUnique({ where: { id: pollId }, include: { options: { select: { id: true } } } });
    if (!poll) throw new UserError("Không tìm thấy bình chọn");
    if (poll.closed || (poll.closesAt && poll.closesAt <= new Date())) throw new UserError("Bình chọn đã kết thúc");
    const valid = new Set(poll.options.map((o) => o.id));
    const picked = [...new Set(optionIds)].filter((id) => valid.has(id));
    if (!picked.length) throw new UserError("Hãy chọn một lựa chọn");
    if (!poll.multiple && picked.length > 1) throw new UserError("Chỉ được chọn một lựa chọn");
    await db.$transaction([
      db.pollVote.deleteMany({ where: { pollId, userId: user.id } }),
      db.pollVote.createMany({ data: picked.map((optionId) => ({ pollId, optionId, userId: user.id })) }),
    ]);
    revalidatePath("/polls");
    return { message: "Đã ghi nhận bình chọn của bạn" };
  });
}

export async function setPollClosedAction(pollId: string, closed: boolean) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    await db.poll.update({ where: { id: pollId }, data: { closed } });
    await audit(admin.id, closed ? "poll.close" : "poll.reopen", "Poll", pollId);
    revalidatePath("/polls");
    return { message: closed ? "Đã kết thúc bình chọn" : "Đã mở lại bình chọn" };
  });
}

export async function deletePollAction(pollId: string) {
  return run(async () => {
    const admin = await requireRole(["ADMIN"]);
    await db.poll.delete({ where: { id: pollId } });
    await audit(admin.id, "poll.delete", "Poll", pollId);
    revalidatePath("/polls");
    return { message: "Đã xóa bình chọn" };
  });
}
