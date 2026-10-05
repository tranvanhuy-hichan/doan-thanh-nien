"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { addCommentAction, deleteCommentAction, deletePostAction, toggleLikeAction } from "@/actions/feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ConfirmButton } from "@/components/ui/modal";
import { Avatar, StatusBadge } from "@/components/ui/misc";
import { reportResult } from "@/components/ui/submit";
import { cn, relativeTime } from "@/utils";

export type PostView = {
  id: string; content: string; imageUrl: string | null; createdAt: string; audience: string;
  author: { name: string; avatarUrl: string | null; roleLabel: string };
  likes: number; liked: boolean; canDelete: boolean;
  comments: { id: string; content: string; createdAt: string; name: string; avatarUrl: string | null; canDelete: boolean }[];
  commentCount: number;
};

export function PostCard({ post, meName, meAvatar }: { post: PostView; meName: string; meAvatar: string | null }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [open, setOpen] = useState(post.commentCount > 0 && post.commentCount <= 2);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  const like = () => {
    // cập nhật lạc quan, hoàn tác nếu lỗi
    setLiked(!liked); setLikes(likes + (liked ? -1 : 1));
    start(async () => {
      const res = await toggleLikeAction(post.id);
      if (res.ok && res.data) { setLiked(res.data.liked); setLikes(res.data.count); }
      else { setLiked(liked); setLikes(likes); reportResult(res); }
    });
  };
  const send = () => start(async () => {
    const res = await addCommentAction(post.id, { content: text });
    if (reportResult(res)) { setText(""); router.refresh(); }
  });

  return (
    <article className="rounded-lg border border-border bg-white/85">
      <div className="flex items-start gap-3 p-4 pb-2">
        <Avatar name={post.author.name} src={post.author.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-medium">{post.author.name}</span>
            <StatusBadge tone={post.audience === "Toàn trường" ? "blue" : "gray"}>{post.audience}</StatusBadge>
          </div>
          <div className="text-xs text-muted">{post.author.roleLabel} · {relativeTime(post.createdAt)}</div>
        </div>
        {post.canDelete && (
          <ConfirmButton trigger={<Trash2 className="size-3.5" />} triggerVariant="ghost" triggerClassName="text-muted" title="Xóa bài viết?" danger confirmLabel="Xóa"
            description="Bài viết cùng ảnh, lượt thích và bình luận sẽ bị xóa."
            onConfirm={async () => { reportResult(await deletePostAction(post.id)); router.refresh(); }} />
        )}
      </div>
      <p className="px-4 pb-3 whitespace-pre-line">{post.content}</p>
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="Ảnh bài viết" className="max-h-[28rem] w-full border-y border-border object-cover" loading="lazy" />
      )}
      <div className="flex items-center gap-1 px-2 py-1.5 text-[13px]">
        <button onClick={like} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-slate-100", liked ? "font-medium text-primary" : "text-muted")} aria-pressed={liked}>
          <Heart className={cn("size-4", liked && "fill-current")} />{likes > 0 ? likes : ""} Thích
        </button>
        <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted hover:bg-slate-100">
          <MessageCircle className="size-4" />{post.commentCount > 0 ? post.commentCount : ""} Bình luận
        </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          {post.commentCount > post.comments.length && <p className="text-xs text-muted">Hiển thị {post.comments.length} bình luận gần nhất</p>}
          {post.comments.map((c) => (
            <div key={c.id} className="group flex gap-2">
              <Avatar name={c.name} src={c.avatarUrl} size={28} />
              <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-lg bg-slate-100 px-3 py-1.5">
                  <div className="text-[13px] font-medium">{c.name}</div>
                  <div className="text-sm break-words whitespace-pre-line">{c.content}</div>
                </div>
                <div className="mt-0.5 flex items-center gap-3 px-1 text-[11px] text-muted">
                  {relativeTime(c.createdAt)}
                  {c.canDelete && <button className="hover:text-danger" onClick={() => start(async () => { reportResult(await deleteCommentAction(c.id)); router.refresh(); })}>Xóa</button>}
                </div>
              </div>
            </div>
          ))}
          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send(); }}>
            <Avatar name={meName} src={meAvatar} size={28} />
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Viết bình luận..." maxLength={1000} />
            <Button type="submit" size="sm" loading={pending} disabled={!text.trim()}>Gửi</Button>
          </form>
        </div>
      )}
    </article>
  );
}
