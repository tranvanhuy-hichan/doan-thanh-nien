import webpush from "web-push";
import { db } from "@/lib/db";

export type PushPayload = { title: string; body?: string | null; url?: string | null; tag?: string };

let configured = false;
export function isPushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
function configure() {
  if (configured) return true;
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
  return true;
}

/** Gửi thông báo đẩy tới mọi thiết bị đã đăng ký của các người dùng. Không bao giờ ném lỗi ra ngoài. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!userIds.length || !configure()) return;
  try {
    const subs = await db.pushSubscription.findMany({ where: { userId: { in: userIds } } });
    const body = JSON.stringify({ title: payload.title, body: payload.body ?? "", url: payload.url ?? "/dashboard", tag: payload.tag });
    const dead: string[] = [];
    await Promise.allSettled(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24, urgency: "high" });
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(s.id); // thiết bị đã gỡ đăng ký
        else console.error("[push]", status, (e as Error).message);
      }
    }));
    if (dead.length) await db.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  } catch (e) {
    console.error("[push] lỗi gửi", e);
  }
}
