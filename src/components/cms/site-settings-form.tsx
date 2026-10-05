"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveSiteSettingsAction } from "@/actions/cms";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload";

const FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "address", label: "Địa chỉ" },
  { key: "phone", label: "Số điện thoại liên hệ" },
  { key: "email", label: "Email liên hệ" },
];

export function SiteSettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<UploadedImage>(initial.bannerUrl && initial.bannerPublicId ? { imageUrl: initial.bannerUrl, publicId: initial.bannerPublicId } : null);
  return (
    <div className="w-full space-y-4">
      <Field label="Ảnh banner đầu trang" hint="Hiển thị bên phải banner trang công khai (nên dùng ảnh ngang, tối thiểu 1200×400)"><ImageUpload folder="activities" value={banner} onChange={setBanner} /></Field>
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.multiline ? <Textarea className="min-h-24" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} /> : <Input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
        </Field>
      ))}
      <Button loading={busy} onClick={async () => {
        setBusy(true); const res = await saveSiteSettingsAction({ ...v, bannerUrl: banner?.imageUrl ?? "", bannerPublicId: banner?.publicId ?? "" }); setBusy(false);
        if (!res.ok) return void toast.error(res.error);
        toast.success(res.message); router.refresh();
      }}>Lưu thông tin</Button>
    </div>
  );
}
