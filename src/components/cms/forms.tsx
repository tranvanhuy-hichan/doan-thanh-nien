"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveArticleAction, saveSitePageAction } from "@/actions/cms";
import { saveReportAction } from "@/actions/chapter-reports";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, WrapInput } from "@/components/ui/form";
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload";
import { FileUpload, type AttachmentValue } from "@/components/ui/file-upload";
import { fromLocalInput } from "@/utils";
import { KIND_ACTION, kindSlug } from "@/lib/services/kind";

export const FORMAT_HINT = "Định dạng: “## Tiêu đề”, “- gạch đầu dòng”, “1. đánh số”, “**chữ đậm**”. Cách một dòng trống để tách đoạn.";

type Errors = Record<string, string>;
const toErrors = (f?: Record<string, string[]>): Errors => Object.fromEntries(Object.entries(f ?? {}).map(([k, m]) => [k, m[0]]));

export function ArticleForm({ id, kind, initial, image, files, draftOnly }: {
  id?: string; /** Bí thư: chỉ lưu bản nháp, chờ Admin duyệt. */ draftOnly?: boolean; files?: AttachmentValue[]; kind: "NEWS" | "PLAN" | "EVENT" | "ANNOUNCEMENT";
  initial?: { title: string; summary: string; content: string; eventAt: string; eventLocation: string; published: boolean };
  image?: UploadedImage;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial ?? { title: "", summary: "", content: "", eventAt: "", eventLocation: "", published: !draftOnly });
  const [img, setImg] = useState<UploadedImage>(image ?? null);
  const [attachments, setAttachments] = useState<AttachmentValue[]>(files ?? []);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function submit() {
    setBusy(true); setErrors({});
    const res = await saveArticleAction(id ?? null, {
      ...v, kind, eventAt: v.eventAt ? fromLocalInput(v.eventAt).toISOString() : "", coverUrl: img?.imageUrl ?? "", coverPublicId: img?.publicId ?? "", attachments,
    });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); setErrors(toErrors(res.fieldErrors)); return; }
    toast.success(res.message);
    router.push(`/cms/${kindSlug(kind)}`); router.refresh();
  }

  return (
    <div className="w-full space-y-4">
      {draftOnly && <p className="rounded-md bg-primary-light px-3 py-2 text-sm text-primary-dark">Bài viết được lưu ở dạng bản nháp. Admin sẽ xem và duyệt trước khi hiển thị trên trang công khai.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {!draftOnly && <Field label="Trạng thái">
          <Select value={v.published ? "1" : "0"} onChange={(e) => setV({ ...v, published: e.target.value === "1" })}><option value="1">Hiển thị công khai</option><option value="0">Bản nháp (ẩn)</option></Select>
        </Field>}
        <Field label="Tiêu đề" required error={errors.title} className="sm:col-span-2"><WrapInput value={v.title} onChange={set("title")} /></Field>
        {kind === "EVENT" && (
          <>
            <Field label="Thời gian diễn ra" required error={errors.eventAt}><Input type="datetime-local" value={v.eventAt} onChange={set("eventAt")} /></Field>
            <Field label="Địa điểm" error={errors.eventLocation}><Input value={v.eventLocation} onChange={set("eventLocation")} /></Field>
          </>
        )}
        <Field label="Tóm tắt" error={errors.summary} className="sm:col-span-2" hint="Hiện ở danh sách và trang chủ"><Textarea className="min-h-20" value={v.summary} onChange={set("summary")} /></Field>
        <Field label="Nội dung" required error={errors.content} className="sm:col-span-2" hint={FORMAT_HINT}><Textarea className="min-h-72" value={v.content} onChange={set("content")} /></Field>
      </div>
      <Field label="Ảnh bìa"><ImageUpload folder="activities" value={img} onChange={setImg} /></Field>
      <Field label="Tệp đính kèm" hint="Người xem có thể xem trực tiếp hoặc tải về"><FileUpload value={attachments} onChange={setAttachments} /></Field>
      <div className="flex gap-2">
        <Button loading={busy} onClick={submit}>{draftOnly ? "Lưu bản nháp" : id ? "Lưu thay đổi" : KIND_ACTION[kind]}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Hủy</Button>
      </div>
    </div>
  );
}

export function SitePageForm({ slug, title, initial }: { slug: string; title: string; initial: string }) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <div className="w-full space-y-4">
      <Field label={`Nội dung trang “${title}”`} hint={FORMAT_HINT}><Textarea className="min-h-96" value={content} onChange={(e) => setContent(e.target.value)} /></Field>
      <div className="flex gap-2">
        <Button loading={busy} onClick={async () => {
          setBusy(true); const res = await saveSitePageAction(slug, { content }); setBusy(false);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message); router.push("/cms/pages"); router.refresh();
        }}>Lưu trang</Button>
        <Button variant="secondary" onClick={() => router.back()}>Hủy</Button>
      </div>
    </div>
  );
}

export function ReportForm({ id, departments, fixedDepartment, initial, image }: {
  id?: string; departments: { id: string; name: string }[]; fixedDepartment?: string;
  initial?: { departmentId: string; title: string; content: string }; image?: UploadedImage;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial ?? { departmentId: "", title: "", content: "" });
  const [img, setImg] = useState<UploadedImage>(image ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  return (
    <div className="w-full space-y-4">
      <Field label="Chi đoàn" required error={errors.departmentId}>
        {fixedDepartment ? <Input value={fixedDepartment} disabled readOnly /> : (
          <Select value={v.departmentId} onChange={(e) => setV({ ...v, departmentId: e.target.value })}><option value="">Chọn Chi đoàn</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
        )}
      </Field>
      <Field label="Tiêu đề báo cáo" required error={errors.title}><WrapInput value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Ví dụ: Báo cáo hoạt động tháng 10" /></Field>
      <Field label="Nội dung" required error={errors.content} hint={FORMAT_HINT}><Textarea className="min-h-72" value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} /></Field>
      <Field label="Ảnh minh họa"><ImageUpload folder="activities" value={img} onChange={setImg} /></Field>
      <div className="flex gap-2">
        <Button loading={busy} onClick={async () => {
          setBusy(true); setErrors({});
          const res = await saveReportAction(id ?? null, { ...v, imageUrl: img?.imageUrl ?? "", imagePublicId: img?.publicId ?? "" });
          setBusy(false);
          if (!res.ok) { toast.error(res.error); setErrors(toErrors(res.fieldErrors)); return; }
          toast.success(res.message); router.push("/chapter-reports"); router.refresh();
        }}>{id ? "Lưu thay đổi" : "Đăng báo cáo"}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Hủy</Button>
      </div>
    </div>
  );
}
