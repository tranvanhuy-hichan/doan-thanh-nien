import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Client cache trong dev bị giữ qua hot-reload; bỏ nếu nó được tạo trước khi `prisma generate` thêm model mới.
const cached = globalForPrisma.prisma && "post" in globalForPrisma.prisma ? globalForPrisma.prisma : undefined;

export const db = cached ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
