"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarSync, Download, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { syncSchoolYearAction, assignSecretaryAction, deleteDepartmentAction, removeSecretaryAction, saveDepartmentAction } from "@/actions/departments";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { Alert, DataTable, Td, Th } from "@/components/ui/misc";
import { downloadCsv } from "@/components/members/credentials";
import type { Credential } from "@/actions/members";
import { reportResult } from "@/components/ui/submit";
import { cohortLabel, schoolYearStart } from "@/lib/school-year";

type Dept = { id: string; name: string; description: string | null; startYear?: number | null };

export function DepartmentFormButton({ dept }: { dept?: Dept }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(dept?.name ?? "");
  const [description, setDescription] = useState(dept?.description ?? "");
  const [startYear, setStartYear] = useState(String(dept?.startYear ?? ""));
  const [memberText, setMemberText] = useState("");
  const [created, setCreated] = useState<Credential[] | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant={dept ? "ghost" : "primary"} size={dept ? "sm" : "md"} onClick={() => setOpen(true)} aria-label={dept ? "Sửa" : "Tạo Chi đoàn"}>
        {dept ? <Pencil className="size-3.5" /> : <><Plus className="size-4" />Tạo Chi đoàn</>}
      </Button>
      <Modal open={open} onClose={() => { setOpen(false); setCreated(null); }} title={dept ? "Sửa Chi đoàn" : "Tạo Chi đoàn"} className="max-w-md">
        {created ? (
          <div className="space-y-3">
            <Alert tone="green">Đã tạo {created.length} tài khoản đoàn viên. <b>Mật khẩu tạm thời chỉ hiển thị một lần</b> – hãy tải về và bàn giao. Sau khi bầu bí thư, dùng nút "Chọn bí thư" để gán quyền cho một đoàn viên.</Alert>
            <Button variant="secondary" size="sm" onClick={() => downloadCsv(created, `tai-khoan-${name || "chi-doan"}.csv`)}><Download className="size-4" />Tải danh sách tài khoản (CSV)</Button>
            <div className="max-h-60 overflow-y-auto">
              <DataTable>
                <thead><tr><Th>Tên đăng nhập</Th><Th>Họ tên</Th><Th>Mật khẩu tạm</Th></tr></thead>
                <tbody>{created.map((c) => <tr key={c.code}><Td className="font-mono text-[13px]">{c.code}</Td><Td>{c.fullName}</Td><Td className="font-mono text-[13px]">{c.password}</Td></tr>)}</tbody>
              </DataTable>
            </div>
            <div className="flex justify-end"><Button onClick={() => { setOpen(false); setCreated(null); }}>Đóng</Button></div>
          </div>
        ) : (
        <div className="space-y-3">
          <Field label="Tên Chi đoàn" required hint="Bắt đầu bằng khối (10, 11, 12), ví dụ 12A1 hoặc 12/1. Tên tự đổi khối theo năm học (12/1 → 11/1 → 10/1)."><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: 12A1 hoặc 12/1" /></Field>
          <Field label="Năm vào lớp 10 (khóa)" hint={startYear ? `Niên khóa ${cohortLabel(Number(startYear))}. Để trống: tự tính theo khối trong tên (năm học hiện tại ${schoolYearStart()}–${schoolYearStart() + 1}).` : `Để trống: tự tính theo khối trong tên (năm học hiện tại ${schoolYearStart()}–${schoolYearStart() + 1}).`}>
            <Input type="number" inputMode="numeric" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder={`Ví dụ: ${schoolYearStart()}`} />
          </Field>
          <Field label="Mô tả"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" /></Field>
          {!dept && (
            <Field label="Danh sách đoàn viên (không bắt buộc)" hint="Mỗi dòng một họ tên. Hệ thống tự tạo lớp, hồ sơ đoàn viên và tài khoản (tên đăng nhập là mã đoàn viên, mật khẩu tạm thời).">
              <Textarea value={memberText} onChange={(e) => setMemberText(e.target.value)} className="min-h-28" placeholder={"Nguyễn Văn An\nTrần Thị Bình"} />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={busy} onClick={async () => {
              setBusy(true);
              const res = await saveDepartmentAction(dept?.id ?? null, { name, description, startYear: startYear ? Number(startYear) : undefined, members: memberText });
              setBusy(false);
              if (!reportResult(res)) return;
              router.refresh();
              if (res.data?.created?.length) setCreated(res.data.created);
              else { setOpen(false); if (!dept) { setName(""); setDescription(""); setMemberText(""); } }
            }}>Lưu</Button>
          </div>
        </div>
        )}
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

export function SecretaryButton({ departmentId, current, candidates }: {
  departmentId: string; current: { id: string; fullName: string; username: string } | null; candidates: { id: string; userId: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><UserCog className="size-3.5" />{current ? "Đổi bí thư" : "Chọn bí thư"}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Bầu bí thư Chi đoàn" className="max-w-md">
        <div className="space-y-3">
          <p className="text-sm text-muted">Chọn một đoàn viên của Chi đoàn. Tài khoản đoàn viên đó được gán thêm quyền bí thư, vẫn giữ quyền đoàn viên. Bí thư cũ trở lại là đoàn viên thường.</p>
          {current && <p className="text-sm">Bí thư hiện tại: <b>{current.fullName}</b></p>}
          {candidates.length === 0 ? <Alert tone="amber">Chi đoàn chưa có đoàn viên. Hãy thêm đoàn viên trước.</Alert> : (
            <Field label="Đoàn viên được bầu"><Select value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">Chọn...</option>{candidates.map((c) => <option key={c.id} value={c.id} disabled={c.userId === current?.id}>{c.label}{c.userId === current?.id ? " (đang là bí thư)" : ""}</option>)}</Select></Field>
          )}
          <div className="flex justify-between gap-2 pt-1">
            <div>{current && <ConfirmButton trigger="Gỡ chức bí thư" triggerVariant="ghost" triggerClassName="text-danger" title="Gỡ chức bí thư?" description="Tài khoản vẫn là đoàn viên của Chi đoàn." danger confirmLabel="Gỡ"
              onConfirm={async () => { reportResult(await removeSecretaryAction(departmentId)); setOpen(false); router.refresh(); }} />}</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button loading={busy} disabled={!memberId} onClick={async () => {
                setBusy(true); const res = await assignSecretaryAction({ departmentId, memberId }); setBusy(false);
                if (reportResult(res)) { setOpen(false); setMemberId(""); router.refresh(); }
              }}>Gán bí thư</Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function SyncSchoolYearButton() {
  const router = useRouter();
  return (
    <ConfirmButton triggerVariant="secondary" trigger={<><CalendarSync className="size-4" /><span className="max-sm:hidden">Cập nhật năm học</span></>} triggerLabel="Cập nhật năm học"
      title="Cập nhật năm học?" description="Đổi tên khối theo năm học (10A1 → 11A1 → 12A1). Chi đoàn đã quá lớp 12 sẽ chuyển sang ra trường và khóa tài khoản đoàn viên, bí thư (dữ liệu được giữ). Hệ thống cũng tự làm việc này mỗi ngày."
      confirmLabel="Cập nhật" onConfirm={async () => { reportResult(await syncSchoolYearAction()); router.refresh(); }} />
  );
}
