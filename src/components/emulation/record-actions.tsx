"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createEmulationRecordAction, deleteEmulationRecordAction } from "@/actions/emulation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";

export function AddRecordButton({ departments, today }: { departments: { id: string; name: string }[]; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ departmentId: "", points: "", reason: "", recordedAt: today });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="size-4" />Ghi điểm thi đua</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Ghi nhận điểm thi đua" className="max-w-md">
        <div className="space-y-3">
          <Field label="Chi đoàn" required><Select value={v.departmentId} onChange={set("departmentId")}><option value="">Chọn Chi đoàn</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số điểm" required hint="Số âm để trừ điểm"><Input type="number" value={v.points} onChange={set("points")} placeholder="Ví dụ: 5 hoặc -2" /></Field>
            <Field label="Ngày ghi nhận" required><Input type="date" value={v.recordedAt} onChange={set("recordedAt")} /></Field>
          </div>
          <Field label="Nội dung" required><Input value={v.reason} onChange={set("reason")} placeholder="Ví dụ: Nề nếp tuần 41 tốt" /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={busy} onClick={async () => {
              setBusy(true);
              const res = await createEmulationRecordAction(v);
              setBusy(false);
              if (reportResult(res)) { setOpen(false); setV({ ...v, points: "", reason: "" }); router.refresh(); }
            }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function DeleteRecordButton({ id }: { id: string }) {
  const router = useRouter();
  return <ConfirmButton trigger={<Trash2 className="size-3.5" />} triggerVariant="ghost" triggerClassName="text-danger" title="Xóa bản ghi điểm thi đua?" danger confirmLabel="Xóa"
    onConfirm={async () => { reportResult(await deleteEmulationRecordAction(id)); router.refresh(); }} />;
}
