"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCategoryAction, saveCategoryAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";

export function CategoryFormButton({ category }: { category?: { id: string; name: string; defaultPoints: number } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [pts, setPts] = useState(String(category?.defaultPoints ?? 3));
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant={category ? "ghost" : "secondary"} size="sm" onClick={() => setOpen(true)} aria-label={category ? "Sửa" : "Thêm loại"}>{category ? <Pencil className="size-3.5" /> : <><Plus className="size-4" />Thêm loại</>}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={category ? "Sửa loại hoạt động" : "Thêm loại hoạt động"} className="max-w-sm">
        <div className="space-y-3">
          <Field label="Tên loại"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Điểm mặc định" hint="Điền sẵn khi tạo hoạt động mới"><Input type="number" min={0} value={pts} onChange={(e) => setPts(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={busy} onClick={async () => {
              setBusy(true);
              const res = await saveCategoryAction(category?.id ?? null, { name, defaultPoints: pts });
              setBusy(false);
              if (reportResult(res)) { setOpen(false); router.refresh(); }
            }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return <ConfirmButton trigger={<Trash2 className="size-3.5" />} triggerVariant="ghost" triggerClassName="text-danger" title={`Xóa loại “${name}”?`} danger confirmLabel="Xóa"
    onConfirm={async () => { reportResult(await deleteCategoryAction(id)); router.refresh(); }} />;
}
