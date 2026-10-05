"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBadgeAction, saveBadgeAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";
import { BADGE_ICON_LABEL } from "./badge-icon";

export const CRITERIA_LABEL: Record<string, string> = {
  ACTIVITY_COUNT: "Số hoạt động tham gia", VOLUNTEER_HOURS: "Số giờ tình nguyện", TOTAL_POINTS: "Tổng điểm hoạt động", CATEGORY_COUNT: "Số hoạt động theo loại",
};

type B = { id: string; name: string; description: string; icon: string; criteria: string; threshold: number; categoryId: string | null };

export function BadgeFormButton({ badge, categories }: { badge?: B; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ name: badge?.name ?? "", description: badge?.description ?? "", icon: badge?.icon ?? "award", criteria: badge?.criteria ?? "ACTIVITY_COUNT", threshold: String(badge?.threshold ?? 10), categoryId: badge?.categoryId ?? "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <Button variant={badge ? "ghost" : "primary"} size={badge ? "sm" : "md"} onClick={() => setOpen(true)} aria-label={badge ? "Sửa" : "Tạo huy hiệu"}>
        {badge ? <Pencil className="size-3.5" /> : <><Plus className="size-4" />Tạo huy hiệu</>}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={badge ? "Sửa huy hiệu" : "Tạo huy hiệu"} className="max-w-md">
        <div className="space-y-3">
          <Field label="Tên" required><Input value={v.name} onChange={set("name")} /></Field>
          <Field label="Mô tả" required><Input value={v.description} onChange={set("description")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Biểu tượng"><Select value={v.icon} onChange={set("icon")}>{Object.entries(BADGE_ICON_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
            <Field label="Ngưỡng đạt"><Input type="number" min={1} value={v.threshold} onChange={set("threshold")} /></Field>
          </div>
          <Field label="Điều kiện"><Select value={v.criteria} onChange={set("criteria")}>{Object.entries(CRITERIA_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          {v.criteria === "CATEGORY_COUNT" && <Field label="Loại hoạt động"><Select value={v.categoryId} onChange={set("categoryId")}><option value="">Chọn loại</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={busy} onClick={async () => {
              setBusy(true);
              const res = await saveBadgeAction(badge?.id ?? null, v);
              setBusy(false);
              if (reportResult(res)) { setOpen(false); router.refresh(); }
            }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function DeleteBadgeButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return <ConfirmButton trigger={<Trash2 className="size-3.5" />} triggerVariant="ghost" triggerClassName="text-danger" title={`Xóa huy hiệu “${name}”?`} danger confirmLabel="Xóa"
    description="Huy hiệu sẽ bị gỡ khỏi tất cả đoàn viên đã đạt." onConfirm={async () => { reportResult(await deleteBadgeAction(id)); router.refresh(); }} />;
}
