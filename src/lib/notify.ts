import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | typeof db;

export async function notifyUser(
  userId: string,
  n: { type: NotificationType; title: string; body?: string; link?: string },
  client: Tx = db,
) {
  await client.notification.create({ data: { userId, ...n } });
}

export async function notifyUsers(
  userIds: string[],
  n: { type: NotificationType; title: string; body?: string; link?: string },
  client: Tx = db,
) {
  if (!userIds.length) return;
  await client.notification.createMany({ data: userIds.map((userId) => ({ userId, ...n })) });
}
