"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { checkInAction, type CheckinSuccess } from "@/actions/activities";
import { Button, buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { formatDateTime } from "@/utils";

export function ConfirmCheckin({ token, activityTitle, memberName, className }: { token: string; activityTitle: string; memberName: string; className: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<CheckinSuccess>();

  if (done) {
    return (
      <div className="max-w-md space-y-4">
        <div className="flex items-center gap-3 text-primary"><CheckCircle2 className="size-9" /><h2 className="text-xl font-semibold">Điểm danh thành công</h2></div>
        <div className="space-y-0.5">
          <p className="font-medium">{done.fullName}</p>
          <p className="text-muted">{done.className}</p>
          <p className="text-muted">{formatDateTime(done.at)}</p>
          <p className="pt-2">{done.activityTitle}{done.points > 0 && <span className="ml-2 font-medium text-primary">+{done.points} điểm</span>}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/history" className={buttonClass("secondary")}>Xem lịch sử</Link>
          <Link href="/dashboard" className={buttonClass("primary")}>Về tổng quan</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-md space-y-4">
      <div>
        <p className="text-sm text-muted">Bạn đang điểm danh hoạt động</p>
        <h2 className="text-lg font-semibold">{activityTitle}</h2>
        <p className="mt-1 text-sm">{memberName} · {className}</p>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <Button loading={pending} onClick={() => start(async () => {
          const res = await checkInAction(token);
          if (res.ok) setDone(res.data); else setError(res.error);
        })}>Xác nhận điểm danh</Button>
        <Link href="/checkin" className={buttonClass("secondary")}>Quét lại</Link>
      </div>
    </div>
  );
}
