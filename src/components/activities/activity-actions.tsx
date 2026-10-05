"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, QrCode, Trash2, XCircle } from "lucide-react";
import { cancelActivityAction, deleteActivityAction, registerActivityAction } from "@/actions/activities";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";

export function RegisterButton({ activityId, registered, disabled, reason }: { activityId: string; registered: boolean; disabled?: boolean; reason?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (registered) {
    return (
      <ConfirmButton trigger="Hủy đăng ký" title="Hủy đăng ký tham gia?" confirmLabel="Hủy đăng ký" danger
        onConfirm={async () => { reportResult(await registerActivityAction(activityId, false)); router.refresh(); }} />
    );
  }
  return (
    <div>
      <Button disabled={disabled} loading={pending} onClick={() => start(async () => { reportResult(await registerActivityAction(activityId, true)); router.refresh(); })}>Đăng ký tham gia</Button>
      {disabled && reason && <p className="mt-1.5 text-xs text-muted">{reason}</p>}
    </div>
  );
}

export function ManageActivityActions({ id, cancelled, hasAttendance }: { id: string; cancelled: boolean; hasAttendance: boolean }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      {!cancelled && <Link href={`/activities/${id}/edit`} className={buttonClass("secondary", "sm")}><Pencil className="size-3.5" />Sửa</Link>}
      {!cancelled && !hasAttendance && (
        <ConfirmButton trigger={<><XCircle className="size-3.5" />Hủy hoạt động</>} title="Hủy hoạt động?" danger confirmLabel="Hủy hoạt động"
          description="Những đoàn viên đã đăng ký sẽ nhận thông báo hoạt động bị hủy."
          onConfirm={async () => { reportResult(await cancelActivityAction(id)); router.refresh(); }} />
      )}
      {!hasAttendance && (
        <ConfirmButton trigger={<><Trash2 className="size-3.5" />Xóa</>} triggerClassName="text-danger" title="Xóa hoạt động?" danger confirmLabel="Xóa"
          description="Hoạt động và danh sách đăng ký sẽ bị xóa vĩnh viễn."
          onConfirm={async () => { if (reportResult(await deleteActivityAction(id))) { router.push("/activities"); router.refresh(); } }} />
      )}
    </div>
  );
}

export const AttendanceLink = ({ id, label = "Mở trang điểm danh" }: { id: string; label?: string }) => (
  <Link href={`/activities/${id}/attendance`} className={buttonClass("primary")}><QrCode className="size-4" />{label}</Link>
);
