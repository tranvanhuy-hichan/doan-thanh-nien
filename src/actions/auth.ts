"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit, getRequestMeta } from "@/lib/audit";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema, loginSchema } from "@/lib/validation";

// Giới hạn đăng nhập sai (bộ nhớ tiến trình; đủ cho một instance, thay bằng Redis khi scale).
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

function throttleKey(username: string, ip: string | null) {
  return `${username.toLowerCase()}|${ip ?? "?"}`;
}
function checkThrottle(key: string) {
  const e = attempts.get(key);
  if (e && Date.now() - e.first > WINDOW_MS) attempts.delete(key);
  const cur = attempts.get(key);
  if (cur && cur.count >= MAX_ATTEMPTS) throw new UserError("Đăng nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút");
}
function recordFailure(key: string) {
  const cur = attempts.get(key);
  if (!cur) attempts.set(key, { count: 1, first: Date.now() });
  else cur.count++;
}

export async function loginAction(input: unknown) {
  return run(async () => {
    const { username, password } = loginSchema.parse(input);
    const { ip } = await getRequestMeta();
    const key = throttleKey(username, ip);
    checkThrottle(key);

    const user = await db.user.findUnique({ where: { username } });
    // So sánh hash cả khi không có user để giảm lộ thông tin qua thời gian phản hồi.
    const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    if (!user || !ok) {
      recordFailure(key);
      throw new UserError("Tên đăng nhập hoặc mật khẩu không đúng");
    }
    if (user.status !== "ACTIVE") throw new UserError("Tài khoản đã bị khóa. Vui lòng liên hệ Ban chấp hành Đoàn trường");

    attempts.delete(key);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);
    await audit(user.id, "auth.login", "User", user.id);
    return { data: { mustChangePassword: user.mustChangePassword } };
  });
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(input: unknown) {
  return run(async () => {
    const user = await requireUser({ allowPasswordChange: true });
    const data = changePasswordSchema.parse(input);
    const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(data.currentPassword, record.passwordHash))) {
      throw new UserError("Mật khẩu hiện tại không đúng");
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.newPassword), mustChangePassword: false },
    });
    await audit(user.id, "auth.change_password", "User", user.id);
    return { message: "Đã đổi mật khẩu" };
  });
}
