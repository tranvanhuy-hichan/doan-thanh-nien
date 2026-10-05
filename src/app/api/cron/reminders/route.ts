import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notify";
import { formatDateTime } from "@/utils";

export const dynamic = "force-dynamic";

/**
 * Nhắc lịch: gửi thông báo (và push) cho người đã đăng ký hoạt động bắt đầu trong 24 giờ tới.
 * Vercel Cron gọi hằng ngày (vercel.json) và gửi `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret ? req.headers.get("authorization") !== `Bearer ${secret}` : process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const activities = await db.activity.findMany({
    where: { cancelledAt: null, reminderSentAt: null, startAt: { gt: now, lte: new Date(now.getTime() + 24 * 3600_000) } },
    select: { id: true, title: true, location: true, startAt: true, registrations: { where: { status: "REGISTERED" }, select: { member: { select: { userId: true } } } } },
  });
  let notified = 0;
  for (const a of activities) {
    const ids = a.registrations.map((r) => r.member.userId);
    // Đánh dấu trước để lần chạy sau không gửi lặp.
    const claimed = await db.activity.updateMany({ where: { id: a.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (!claimed.count) continue;
    await notifyUsers(ids, { type: "ACTIVITY_REMINDER", title: "Sắp diễn ra: " + a.title, body: `${formatDateTime(a.startAt)} · ${a.location}`, link: `/activities/${a.id}` });
    notified += ids.length;
  }
  return NextResponse.json({ activities: activities.length, notified });
}
