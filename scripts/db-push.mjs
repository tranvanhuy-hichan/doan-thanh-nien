// Chạy `prisma db push` có thử lại: DB gói nhỏ có thể tạm hết kết nối khi các instance đang chạy giữ pool.
import { spawnSync } from "node:child_process";

const MAX = 6;
for (let i = 1; i <= MAX; i++) {
  const r = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], { encoding: "utf8", shell: process.platform === "win32" });
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  if (r.status === 0) process.exit(0);
  const busy = /too many connections|Schema engine error|timed out/i.test((r.stdout ?? "") + (r.stderr ?? ""));
  if (!busy || i === MAX) process.exit(r.status ?? 1);
  console.log(`[db-push] DB bận, thử lại lần ${i + 1}/${MAX} sau 15 giây...`);
  await new Promise((res) => setTimeout(res, 15000));
}
