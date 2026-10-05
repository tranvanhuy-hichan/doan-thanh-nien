"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveArticleAction, saveSitePageAction } from "@/actions/cms";
import { saveReportAction } from "@/actions/chapter-reports";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload";
import { fromLocalInput } from "@/utils";

export const FORMAT_HINT = "Định dạng: “## Tiêu đề”, “- gạch đầu dòng”, “1. đánh số”, “**chữ đậm**”. Cách một dòng trống để tách đoạn.";

type Errors = Record<string, string>;
const toErrors = (f?: Record<string, string[]>): Errors => Object.fromEntries(Object.entries(f ?? {}).map(([k, m]) => [k, m[0]]));

export function ArticleForm({ id, initial, image }: {
  id?: string;
  initial?: { kind: string; title: string; summary: string; content: string; eventAt: string; eventLocation: string; published: boolean };
  image?: UploadedImage;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial ?? { kind: "NEWS", title: "", summary: "", content: "", eventAt: "", eventLocation: "", published: true });
  const [img, setImg] = useState<UploadedImage>(image ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function submit() {
    setBusy(true); setErrors({});
    const res = await saveArticleAction(id ?? null, {
      ...v, eventAt: v.eventAt ? fromLocalInput(v.eventAt).toISOString() : "", coverUrl: img?.imageUrl ?? "", coverPublicId: img?.publicId ?? "",
    });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); setErrors(toErrors(res.fieldErrors)); return; }
    toast.success(res.message);
    router.push("/cms/articles"); router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Loại bài" required>
          <Select value={v.kind} onChange={set("kind")}><option value="NEWS">Tin tức</option><option value="PLAN">Kế hoạch</option><option value="EVENT">Sự kiện</option><option value="ANNOUNCEMENT">Thông báo</option></Select>
        </Field>
        <Field label="Trạng thái">
          <Select value={v.published ? "1" : "0"} onChange={(e) => setV({ ...v, published: e.target.value === "1" })}><option value="1">Hiển thị công khai</option><option value="0">Bản nháp (ẩn)</option></Select>
        </Field>
        <Field label="Tiêu đề" required error={errors.title} className="sm:col-span-2"><Input value={v.title} onChange={set("title")} /></Field>
        {v.kind === "EVENT" && (
          <>
            <Field label="Thời gian diễn ra" required error={errors.eventAt}><Input type="datetime-local" value={v.eventAt} onChange={set("eventAt")} /></Field>
            <Field label="Địa điểm" error={errors.eventLocation}><Input value={v.eventLocation} onChange={set("eventLocation")} /></Field>
          </>
        )}
        <Field label="Tóm tắt" error={errors.summary} className="sm:col-span-2" hint="Hiện ở danh sách và trang chủ"><Textarea className="min-h-20" value={v.summary} onChange={set("summary")} /></Field>
        <Field label="Nội dung" required error={errors.content} className="sm:col-span-2" hint={FORMAT_HINT}><Textarea className="min-h-72" value={v.content} onChange={set("content")} /></Field>
      </div>
      <Field label="Ảnh bìa"><ImageUpload folder="activities" value={img} onChange={setImg} /></Field>
      <div className="flex gap-2">
        <Button loading={busy} onClick={submit}>{id ? "Lưu thay đổi" : "Đăng bài"}</Button>
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
    <div className="max-w-3xl space-y-4">
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
    <div className="max-w-3xl space-y-4">
      <Field label="Chi đoàn" required error={errors.departmentId}>
        {fixedDepartment ? <Input value={fixedDepartment} disabled readOnly /> : (
          <Select value={v.departmentId} onChange={(e) => setV({ ...v, departmentId: e.target.value })}><option value="">Chọn Chi đoàn</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
        )}
      </Field>
      <Field label="Tiêu đề báo cáo" required error={errors.title}><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Ví dụ: Báo cáo hoạt động tháng 10" /></Field>
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
