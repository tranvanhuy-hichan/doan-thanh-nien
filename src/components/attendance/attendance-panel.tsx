"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import QRCode from "qrcode";
import { Maximize2, RefreshCw, Search, Undo2, UserCheck } from "lucide-react";
import { getCheckinQrAction, manualCheckInAction, revokeAttendanceAction, rotateCheckinQrAction, setCheckinOpenAction } from "@/actions/activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { DataTable, EmptyState, StatusBadge, Td, Th } from "@/components/ui/misc";
import { reportResult } from "@/components/ui/submit";
import { formatTime } from "@/utils";

export type RosterRow = { memberId: string; code: string; fullName: string; className: string; attendanceId: string | null; checkedInAt: string | null; method: string | null };

const ROSTER_PAGE = 15;
const POLL_MS = 8000;
const QR_REFRESH_MS = 45_000;

export function AttendancePanel({ activityId, title, open, canOpen, roster, total }: {
  activityId: string; title: string; open: boolean; canOpen: boolean; roster: RosterRow[]; total: number;
}) {
  const router = useRouter();
  const [qr, setQr] = useState("");
  const [count, setCount] = useState(roster.filter((r) => r.attendanceId).length);
  const [big, setBig] = useState(false);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pending, start] = useTransition();
  const issued = useRef(0);
  const lastCount = useRef(count);

  const refresh = useCallback(async (force = false) => {
    const res = await getCheckinQrAction(activityId);
    if (!res.ok || !res.data) return;
    setCount(res.data.count);
    if (res.data.count !== lastCount.current) { lastCount.current = res.data.count; router.refresh(); }
    if (res.data.open && res.data.url && (force || Date.now() - issued.current > QR_REFRESH_MS)) {
      issued.current = Date.now();
      setQr(await QRCode.toDataURL(res.data.url, { width: 512, margin: 2, errorCorrectionLevel: "M", color: { dark: "#084a8c" } }));
    }
    if (!res.data.open) setQr("");
  }, [activityId, router]);

  useEffect(() => {
    if (!open) return;
    void refresh(true);
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [open, refresh]);

  const toggle = () => start(async () => {
    const res = await setCheckinOpenAction(activityId, !open);
    reportResult(res);
    router.refresh();
  });

  const rows = roster.filter((r) => !filter || r.fullName.toLowerCase().includes(filter.toLowerCase()) || r.code.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="flex size-64 shrink-0 items-center justify-center rounded-lg border border-border bg-white p-2">
          {open && qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Mã QR điểm danh" className="size-full" />
          ) : (
            <p className="px-6 text-center text-sm text-muted">{open ? "Đang tạo mã QR..." : "Điểm danh đang đóng"}</p>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{count} <span className="text-lg font-normal text-muted">/ {total} đã tham gia</span></div>
            <div className="mt-1"><StatusBadge tone={open ? "green" : "gray"}>{open ? "Đang mở điểm danh" : "Đã đóng"}</StatusBadge></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={open ? "secondary" : "primary"} loading={pending} disabled={!open && !canOpen} onClick={toggle}>{open ? "Đóng điểm danh" : "Mở điểm danh"}</Button>
            {open && <Button variant="secondary" onClick={() => setBig(true)}><Maximize2 className="size-4" />Phóng to QR</Button>}
            {open && (
              <ConfirmButton size="md" trigger={<><RefreshCw className="size-4" />Tạo QR mới</>} title="Tạo mã QR mới?"
                description="Mọi mã QR cũ (kể cả ảnh chụp màn hình) sẽ lập tức vô hiệu." confirmLabel="Tạo mới"
                onConfirm={async () => { reportResult(await rotateCheckinQrAction(activityId)); await refresh(true); }} />
            )}
          </div>
          {!open && !canOpen && <p className="max-w-sm text-sm text-muted">Chỉ mở được điểm danh từ 60 phút trước giờ bắt đầu đến 120 phút sau giờ kết thúc.</p>}
          {open && <p className="max-w-sm text-sm text-muted">Mã QR tự làm mới sau mỗi ~90 giây để tránh chia sẻ ngoài buổi sinh hoạt. Đoàn viên đăng nhập và quét mã bằng trang “Quét QR”.</p>}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Danh sách đoàn viên</h2>
          <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-400" />
            <Input className="pl-8" placeholder="Tìm tên hoặc mã..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} /></div>
        </div>
        {rows.length === 0 ? <div className="rounded-lg border border-border bg-white"><EmptyState title="Không có đoàn viên phù hợp" /></div> : (
          <DataTable>
            <thead><tr><Th>Mã</Th><Th>Họ tên</Th><Th>Lớp</Th><Th>Điểm danh</Th><Th /></tr></thead>
            <tbody>{rows.slice((page - 1) * ROSTER_PAGE, page * ROSTER_PAGE).map((r) => (
              <tr key={r.memberId}>
                <Td className="font-mono text-[13px]">{r.code}</Td><Td className="font-medium">{r.fullName}</Td><Td>{r.className}</Td>
                <Td>{r.attendanceId ? <StatusBadge tone="green">{formatTime(r.checkedInAt!)}{r.method === "MANUAL" ? " · thủ công" : ""}</StatusBadge> : <StatusBadge>Chưa tham gia</StatusBadge>}</Td>
                <Td className="text-right">
                  {r.attendanceId ? (
                    <ConfirmButton trigger={<Undo2 className="size-3.5" />} triggerVariant="ghost" title={`Hủy điểm danh của ${r.fullName}?`} danger confirmLabel="Hủy điểm danh"
                      description="Điểm đã cộng cho hoạt động này sẽ được hoàn lại."
                      onConfirm={async () => { reportResult(await revokeAttendanceAction(r.attendanceId!)); router.refresh(); }} />
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => start(async () => { reportResult(await manualCheckInAction(activityId, r.memberId)); router.refresh(); })}><UserCheck className="size-3.5" />Điểm danh hộ</Button>
                  )}
                </Td>
              </tr>
            ))}</tbody>
          </DataTable>
        )}
        {rows.length > ROSTER_PAGE && (
          <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
            <span>{(page - 1) * ROSTER_PAGE + 1}–{Math.min(page * ROSTER_PAGE, rows.length)} / {rows.length}</span>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
              <span className="px-2">Trang {page}/{Math.ceil(rows.length / ROSTER_PAGE)}</span>
              <Button variant="secondary" size="sm" disabled={page * ROSTER_PAGE >= rows.length} onClick={() => setPage(page + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={big} onClose={() => setBig(false)} title={title} className="max-w-xl">
        {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt="Mã QR điểm danh" className="mx-auto w-full max-w-md" />}
        <p className="mt-2 text-center text-2xl font-semibold tabular-nums">{count} / {total}</p>
      </Modal>
    </div>
  );
}

