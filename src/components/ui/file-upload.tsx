"use client";
import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";

export type AttachmentValue = { name: string; url: string; publicId: string; size: number; mime?: string };

export const formatSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Chọn nhiều tệp tài liệu (PDF/Word/Excel/PowerPoint) và tải lên qua API server. */
export function FileUpload({ value, onChange, max = 10 }: { value: AttachmentValue[]; onChange: (v: AttachmentValue[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const added: AttachmentValue[] = [];
    for (const file of Array.from(files)) {
      if (value.length + added.length >= max) { toast.error(`Tối đa ${max} tệp`); break; }
      try {
        const fd = new FormData();
        fd.set("file", file); fd.set("folder", "documents");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Tải tệp thất bại");
        added.push(json);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "Tải tệp thất bại"}`);
      }
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border bg-white/85">
          {value.map((f) => (
            <li key={f.publicId} className="flex items-center gap-3 px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-xs text-muted">{formatSize(f.size)}</span>
              <button type="button" onClick={() => onChange(value.filter((x) => x.publicId !== f.publicId))} className="rounded p-1 text-muted hover:bg-slate-100 hover:text-danger" aria-label={`Gỡ ${f.name}`}><X className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => pick(e.target.files)} />
      <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}><Paperclip className="size-4" />Đính kèm tệp</Button>
      <p className="text-xs text-muted">PDF, Word, Excel, PowerPoint · tối đa 10MB mỗi tệp · tối đa {max} tệp</p>
    </div>
  );
}
