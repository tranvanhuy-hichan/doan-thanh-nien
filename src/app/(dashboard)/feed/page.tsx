import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { buttonClass } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { postScope } from "@/lib/services/queries";
import { canManageDepartment } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/nav";
import { pageParam } from "@/utils";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { PostCard } from "@/components/feed/post-card";

export const metadata = { title: "Bảng tin" };
const PAGE_SIZE = 8;
const COMMENTS_SHOWN = 20;

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const page = pageParam((await searchParams).page);
  const where = postScope(user);
  const staff = user.role !== "MEMBER";

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: {
        author: { select: { fullName: true, role: true, member: { select: { avatarUrl: true } } } },
        department: { select: { name: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: "desc" }, take: COMMENTS_SHOWN,
          include: { user: { select: { fullName: true, member: { select: { avatarUrl: true } } } } },
        },
      },
    }),
    db.post.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Bảng tin" description="Thông báo và hình ảnh hoạt động từ Đoàn trường và các Chi đoàn"
        actions={staff && <Link href="/feed/new" className={buttonClass()}><Plus className="size-4" />Đăng bài</Link>} />
      <div className="w-full space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-border bg-white"><EmptyState title="Chưa có bài viết nào" description={staff ? "Hãy đăng bài đầu tiên cho đoàn viên." : "Các bài đăng mới sẽ xuất hiện tại đây."} /></div>
        ) : posts.map((p) => (
          <PostCard key={p.id} meName={user.fullName} meAvatar={user.avatarUrl} post={{
            id: p.id, content: p.content, imageUrl: p.imageUrl, createdAt: p.createdAt.toISOString(),
            audience: p.department ? `Chi đoàn ${p.department.name}` : "Toàn trường",
            author: { name: p.author.fullName, avatarUrl: p.author.member?.avatarUrl ?? null, roleLabel: ROLE_LABEL[p.author.role] },
            likes: p._count.likes, liked: p.likes.length > 0, commentCount: p._count.comments,
            canDelete: p.authorId === user.id || user.role === "ADMIN" || canManageDepartment(user, p.departmentId),
            comments: p.comments.slice().reverse().map((c) => ({
              id: c.id, content: c.content, createdAt: c.createdAt.toISOString(), name: c.user.fullName, avatarUrl: c.user.member?.avatarUrl ?? null,
              canDelete: c.userId === user.id || p.authorId === user.id || user.role === "ADMIN" || canManageDepartment(user, p.departmentId),
            })),
          }} />
        ))}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/feed" params={{}} />
      </div>
    </>
  );
}
