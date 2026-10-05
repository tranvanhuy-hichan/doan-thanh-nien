"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { deleteArticleAction, setArticlePublishedAction } from "@/actions/cms";
import { deleteReportAction } from "@/actions/chapter-reports";
import { buttonClass } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";

export function ArticleRowActions({ id, published, base }: { id: string; published: boolean; base: string }) {
  const router = useRouter();
  return (
    <span className="inline-flex items-center gap-1">
      <ConfirmButton triggerVariant="ghost" triggerLabel={published ? "Ẩn bài" : "Hiển thị bài"} trigger={published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        title={published ? "Ẩn bài viết?" : "Hiển thị bài viết?"} description={published ? "Bài sẽ không còn hiện trên trang công khai." : "Bài sẽ hiện công khai ngay."} confirmLabel={published ? "Ẩn" : "Hiển thị"}
        onConfirm={async () => { reportResult(await setArticlePublishedAction(id, !published)); router.refresh(); }} />
      <Link href={`${base}/${id}/edit`} className={buttonClass("ghost", "sm")} aria-label="Sửa"><Pencil className="size-3.5" /></Link>
      <ConfirmButton triggerVariant="ghost" triggerClassName="text-danger" triggerLabel="Xóa" trigger={<Trash2 className="size-3.5" />} title="Xóa bài viết?" danger confirmLabel="Xóa"
        onConfirm={async () => { reportResult(await deleteArticleAction(id)); router.refresh(); }} />
    </span>
  );
}

export function ReportRowActions({ id }: { id: string }) {
  const router = useRouter();
  return (
    <span className="inline-flex items-center gap-1">
      <Link href={`/chapter-reports/${id}/edit`} className={buttonClass("ghost", "sm")} aria-label="Sửa"><Pencil className="size-3.5" /></Link>
      <ConfirmButton triggerVariant="ghost" triggerClassName="text-danger" triggerLabel="Xóa" trigger={<Trash2 className="size-3.5" />} title="Xóa báo cáo?" danger confirmLabel="Xóa"
        onConfirm={async () => { reportResult(await deleteReportAction(id)); router.refresh(); }} />
    </span>
  );
}
