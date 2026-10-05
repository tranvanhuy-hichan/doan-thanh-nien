"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveSiteSettingsAction } from "@/actions/cms";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";

const FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "heroTitle", label: "Tiêu đề banner trang chủ" },
  { key: "heroSubtitle", label: "Mô tả banner trang chủ", multiline: true },
  { key: "address", label: "Địa chỉ" },
  { key: "phone", label: "Số điện thoại liên hệ" },
  { key: "email", label: "Email liên hệ" },
];

export function SiteSettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-2xl space-y-4">
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.multiline ? <Textarea className="min-h-24" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} /> : <Input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
        </Field>
      ))}
      <Button loading={busy} onClick={async () => {
        setBusy(true); const res = await saveSiteSettingsAction(v); setBusy(false);
        if (!res.ok) return void toast.error(res.error);
        toast.success(res.message); router.refresh();
      }}>Lưu thông tin</Button>
    </div>
  );
}
