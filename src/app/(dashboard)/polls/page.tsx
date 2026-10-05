import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { pageParam } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { PollCard, type PollView } from "@/components/polls/poll-card";

export const metadata = { title: "Bình chọn" };
const PAGE_SIZE = 8;

export default async function PollsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const page = pageParam((await searchParams).page);
  const [polls, total] = await Promise.all([
    db.poll.findMany({
      orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { options: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { votes: true } } } }, votes: { where: { userId: user.id }, select: { optionId: true } } },
    }),
    db.poll.count(),
  ]);
  const voters = polls.length
    ? await db.pollVote.groupBy({ by: ["pollId", "userId"], where: { pollId: { in: polls.map((p) => p.id) } } })
    : [];
  const now = Date.now();
  const views: PollView[] = polls.map((p) => ({
    id: p.id, question: p.question, description: p.description, multiple: p.multiple, closesAt: p.closesAt?.toISOString() ?? null, closed: p.closed,
    ended: p.closed || (!!p.closesAt && p.closesAt.getTime() <= now),
    options: p.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
    totalVoters: voters.filter((v) => v.pollId === p.id).length, mine: p.votes.map((v) => v.optionId),
  }));
  return (
    <>
      <PageHeader title="Bình chọn" description="Khảo sát nhanh ý kiến đoàn viên"
        actions={isAdmin && <Link href="/polls/new" className={buttonClass()}><Plus className="size-4" />Tạo bình chọn</Link>} />
      {views.length === 0 ? <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có bình chọn" description={isAdmin ? "Tạo bình chọn đầu tiên để lấy ý kiến đoàn viên." : "Khi có bình chọn mới, bạn sẽ nhận được thông báo."} /></div> : (
        <div className="grid gap-4 lg:grid-cols-2">{views.map((p) => <PollCard key={p.id} poll={p} isAdmin={isAdmin} />)}</div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/polls" params={{}} />
    </>
  );
}
