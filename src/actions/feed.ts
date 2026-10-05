"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { run, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { requireRole, requireUser, type SessionUser } from "@/lib/auth/session";
import { ForbiddenError, canManageDepartment } from "@/lib/permissions";
import { commentSchema, postSchema } from "@/lib/validation";
import { deleteImage, isOwnPublicId } from "@/lib/cloudinary";
import { notifyUser } from "@/lib/notify";
import { postScope } from "@/lib/services/queries";

async function visiblePost(user: SessionUser, id: string) {
  const post = await db.post.findFirst({ where: { id, ...postScope(user) } });
  if (!post) throw new UserError("Không tìm thấy bài viết");
  return post;
}

export async function createPostAction(input: unknown) {
  return run(async () => {
    const user = await requireRole(["ADMIN", "SECRETARY"]);
    const data = postSchema.parse(input);
    // Bí thư luôn đăng trong Chi đoàn của mình; chỉ Admin được đăng toàn trường hoặc chọn Chi đoàn.
    const departmentId = user.role === "SECRETARY" ? user.departmentId : data.departmentId ?? null;
    if (user.role === "SECRETARY" && !departmentId) throw new ForbiddenError();
    if (departmentId && !(await db.department.findUnique({ where: { id: departmentId } }))) throw new UserError("Chi đoàn không tồn tại");
    if (data.imagePublicId && !isOwnPublicId(data.imagePublicId, "activities")) throw new UserError("Ảnh không hợp lệ");

    const post = await db.post.create({
      data: { authorId: user.id, departmentId, content: data.content, imageUrl: data.imageUrl ?? null, imagePublicId: data.imagePublicId ?? null },
    });
    await audit(user.id, "post.create", "Post", post.id, { departmentId });
    revalidatePath("/feed");
    return { message: "Đã đăng bài" };
  });
}

export async function deletePostAction(id: string) {
  return run(async () => {
    const user = await requireUser();
    const post = await visiblePost(user, id);
    // Tác giả hoặc người quản lý Chi đoàn của bài (Admin quản lý tất cả)
    if (post.authorId !== user.id && !canManageDepartment(user, post.departmentId) && user.role !== "ADMIN") throw new ForbiddenError();
    await db.post.delete({ where: { id } });
    await deleteImage(post.imagePublicId);
    await audit(user.id, "post.delete", "Post", id);
    revalidatePath("/feed");
    return { message: "Đã xóa bài viết" };
  });
}

export async function toggleLikeAction(postId: string) {
  return run<{ liked: boolean; count: number }>(async () => {
    const user = await requireUser();
    await visiblePost(user, postId);
    const key = { postId_userId: { postId, userId: user.id } };
    const existing = await db.postLike.findUnique({ where: key });
    if (existing) await db.postLike.delete({ where: key });
    else await db.postLike.upsert({ where: key, update: {}, create: { postId, userId: user.id } });
    const count = await db.postLike.count({ where: { postId } });
    return { data: { liked: !existing, count } };
  });
}

export async function addCommentAction(postId: string, input: unknown) {
  return run(async () => {
    const user = await requireUser();
    const post = await visiblePost(user, postId);
    const { content } = commentSchema.parse(input);
    await db.postComment.create({ data: { postId, userId: user.id, content } });
    if (post.authorId !== user.id) {
      await notifyUser(post.authorId, { type: "FEED", title: `${user.fullName} đã bình luận bài viết của bạn`, body: content.slice(0, 100), link: "/feed" });
    }
    revalidatePath("/feed");
    return { message: "Đã gửi bình luận" };
  });
}

export async function deleteCommentAction(id: string) {
  return run(async () => {
    const user = await requireUser();
    const c = await db.postComment.findUnique({ where: { id }, include: { post: true } });
    if (!c) throw new UserError("Không tìm thấy bình luận");
    await visiblePost(user, c.postId);
    // Người viết, tác giả bài, hoặc người quản lý Chi đoàn của bài được xóa
    const allowed = c.userId === user.id || c.post.authorId === user.id || user.role === "ADMIN" || canManageDepartment(user, c.post.departmentId);
    if (!allowed) throw new ForbiddenError();
    await db.postComment.delete({ where: { id } });
    revalidatePath("/feed");
    return { message: "Đã xóa bình luận" };
  });
}
