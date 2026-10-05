"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { assignSecretaryAction, deleteDepartmentAction, removeSecretaryAction, saveDepartmentAction } from "@/actions/departments";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/misc";
import { reportResult } from "@/components/ui/submit";

type Dept = { id: string; name: string; description: string | null };

export function DepartmentFormButton({ dept }: { dept?: Dept }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(dept?.name ?? "");
  const [description, setDescription] = useState(dept?.description ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant={dept ? "ghost" : "primary"} size={dept ? "sm" : "md"} onClick={() => setOpen(true)} aria-label={dept ? "Sửa" : "Tạo Chi đoàn"}>
        {dept ? <Pencil className="size-3.5" /> : <><Plus className="size-4" />Tạo Chi đoàn</>}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={dept ? "Sửa Chi đoàn" : "Tạo Chi đoàn"} className="max-w-md">
        <div className="space-y-3">
          <Field label="Tên Chi đoàn" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: 12A1" /></Field>
          <Field label="Mô tả"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={busy} onClick={async () => {
              setBusy(true);
              const res = await saveDepartmentAction(dept?.id ?? null, { name, description });
              setBusy(false);
              if (reportResult(res)) { setOpen(false); if (!dept) { setName(""); setDescription(""); } router.refresh(); }
            }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function DeleteDepartmentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  return (
    <ConfirmButton trigger={<Trash2 className="size-3.5" />} triggerVariant="ghost" triggerClassName="text-danger" title={`Xóa Chi đoàn ${name}?`} danger confirmLabel="Xóa"
      description="Chỉ xóa được Chi đoàn không còn đoàn viên. Các hoạt động của Chi đoàn cũng sẽ bị xóa."
      onConfirm={async () => { reportResult(await deleteDepartmentAction(id)); router.refresh(); }} />
  );
}

export function SecretaryButton({ departmentId, current, available }: {
  departmentId: string; current: { id: string; fullName: string; username: string } | null; available: { id: string; fullName: string; username: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">(available.length ? "existing" : "new");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ username: string; tempPassword: string } | null>(null);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><UserCog className="size-3.5" />{current ? "Đổi bí thư" : "Phân công"}</Button>
      <Modal open={open} onClose={() => { setOpen(false); setCreated(null); }} title="Phân công Bí thư Chi đoàn" className="max-w-md">
        {created ? (
          <div className="space-y-3 text-sm">
            <Alert tone="green">Đã tạo tài khoản bí thư. Mật khẩu tạm thời chỉ hiển thị một lần.</Alert>
            <p>Tên đăng nhập: <b className="font-mono">{created.username}</b></p>
            <p>Mật khẩu tạm: <b className="font-mono select-all">{created.tempPassword}</b></p>
            <div className="flex justify-end"><Button onClick={() => { setOpen(false); setCreated(null); }}>Đóng</Button></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              {available.length > 0 && <label className="flex items-center gap-1.5"><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} />Chọn bí thư có sẵn</label>}
              <label className="flex items-center gap-1.5"><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} />Tạo tài khoản mới</label>
            </div>
            {mode === "existing" ? (
              <Field label="Bí thư"><Select value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">Chọn...</option>{available.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>)}</Select></Field>
            ) : (
              <>
                <Field label="Họ tên"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
                <Field label="Tên đăng nhập"><Input value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
              </>
            )}
            <div className="flex justify-between gap-2 pt-1">
              <div>{current && <ConfirmButton trigger="Gỡ bí thư hiện tại" triggerVariant="ghost" triggerClassName="text-danger" title="Gỡ bí thư?" danger confirmLabel="Gỡ"
                onConfirm={async () => { reportResult(await removeSecretaryAction(departmentId)); setOpen(false); router.refresh(); }} />}</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
                <Button loading={busy} onClick={async () => {
                  setBusy(true);
                  const res = await assignSecretaryAction({ departmentId, mode, userId, username, fullName });
                  setBusy(false);
                  if (!reportResult(res)) return;
                  router.refresh();
                  if (res.data?.tempPassword) setCreated({ username: res.data.username!, tempPassword: res.data.tempPassword }); else setOpen(false);
                }}>Phân công</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
