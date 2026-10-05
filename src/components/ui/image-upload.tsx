"use client";
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";

export type UploadedImage = { imageUrl: string; publicId: string } | null;

/** Tải ảnh lên Cloudinary qua API server (secret không bao giờ xuống client). */
export function ImageUpload({ folder, value, onChange, shape = "wide" }: {
  folder: "activities" | "members" | "certificates"; value: UploadedImage; onChange: (v: UploadedImage) => void; shape?: "wide" | "square";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Tải ảnh thất bại");
      onChange(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const box = shape === "wide" ? "h-32 w-56" : "size-28";
  return (
    <div className="flex items-start gap-3">
      <div className={`${box} flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-slate-50`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.imageUrl} alt="Ảnh đã chọn" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-slate-300" />
        )}
      </div>
      <div className="space-y-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>{value ? "Đổi ảnh" : "Chọn ảnh"}</Button>
        {value && <Button variant="ghost" size="sm" onClick={() => onChange(null)}><Trash2 className="size-3.5" />Gỡ ảnh</Button>}
        <p className="text-xs text-muted">JPG, PNG, WebP · tối đa 5MB</p>
      </div>
    </div>
  );
}
