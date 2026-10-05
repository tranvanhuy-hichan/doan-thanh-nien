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

  const pageRows = rows.slice((page - 1) * ROSTER_PAGE, page * ROSTER_PAGE);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-[18rem_1fr] md:gap-8">
        <div className="mx-auto w-full max-w-72 md:mx-0">
          <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-white p-3">
            {open && qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Mã QR điểm danh" className="size-full" />
            ) : (
              <p className="px-6 text-center text-sm text-muted">{open ? "Đang tạo mã QR..." : "Điểm danh đang đóng"}</p>
            )}
          </div>
          {open && <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted"><RefreshCw className="size-3" />Mã tự làm mới mỗi ~90 giây</p>}
        </div>

        <div className="space-y-5 md:py-1">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge tone={open ? "green" : "gray"}>{open ? "Đang mở điểm danh" : "Đã đóng"}</StatusBadge>
              <span className="text-sm font-medium tabular-nums text-muted">{total ? Math.round((count / total) * 100) : 0}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl leading-none font-semibold tabular-nums">{count}</span>
              <span className="text-base text-muted">/ {total} đoàn viên đã tham gia</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={count} aria-valuemax={total}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${total ? Math.min(100, (count / total) * 100) : 0}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
            <Button variant={open ? "secondary" : "primary"} loading={pending} disabled={!open && !canOpen} onClick={toggle} className="max-md:w-full max-md:px-2">
              {open ? "Đóng" : "Mở"}<span className="max-sm:hidden"> điểm danh</span>
            </Button>
            {open && <Button variant="secondary" onClick={() => setBig(true)} className="max-md:w-full max-md:px-2"><Maximize2 className="size-4" />Phóng to<span className="max-sm:hidden"> QR</span></Button>}
            {open && (
              <ConfirmButton size="md" triggerClassName="max-md:w-full max-md:px-2" trigger={<><RefreshCw className="size-4" />QR mới</>} title="Tạo mã QR mới?"
                description="Mọi mã QR cũ (kể cả ảnh chụp màn hình) sẽ lập tức vô hiệu." confirmLabel="Tạo mới"
                onConfirm={async () => { reportResult(await rotateCheckinQrAction(activityId)); await refresh(true); }} />
            )}
          </div>

          {!open && !canOpen && <p className="text-sm text-muted">Chỉ mở được điểm danh từ 60 phút trước giờ bắt đầu đến 120 phút sau giờ kết thúc.</p>}
          {open && <p className="border-l-2 border-primary/30 pl-3 text-[13px] leading-relaxed text-muted">Đoàn viên đăng nhập, chọn <b className="font-medium text-foreground">Quét QR</b> rồi quét mã này. Dùng “QR mới” nếu mã bị chia sẻ ra ngoài buổi sinh hoạt.</p>}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Danh sách đoàn viên</h2>
          <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-400" />
            <Input className="pl-8" placeholder="Tìm tên hoặc mã..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} /></div>
        </div>
        {rows.length === 0 ? <div className="rounded-lg border border-border bg-white"><EmptyState title="Không có đoàn viên phù hợp" /></div> : (
          <>
          <ul className="divide-y divide-border rounded-lg border border-border bg-white sm:hidden">
            {pageRows.map((r) => (
              <li key={r.memberId} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.fullName}</div>
                  <div className="truncate text-xs text-muted"><span className="font-mono">{r.code}</span> · {r.className}</div>
                </div>
                {r.attendanceId ? <StatusBadge tone="green">{formatTime(r.checkedInAt!)}</StatusBadge> : <StatusBadge>Chưa</StatusBadge>}
                {r.attendanceId ? (
                  <ConfirmButton trigger={<Undo2 className="size-4" />} triggerVariant="ghost" triggerClassName="px-2" title={`Hủy điểm danh của ${r.fullName}?`} danger confirmLabel="Hủy điểm danh"
                    description="Điểm đã cộng cho hoạt động này sẽ được hoàn lại."
                    onConfirm={async () => { reportResult(await revokeAttendanceAction(r.attendanceId!)); router.refresh(); }} />
                ) : (
                  <Button variant="secondary" size="sm" className="px-2" aria-label="Điểm danh hộ" onClick={() => start(async () => { reportResult(await manualCheckInAction(activityId, r.memberId)); router.refresh(); })}><UserCheck className="size-4" /></Button>
                )}
              </li>
            ))}
          </ul>
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>Mã</Th><Th>Họ tên</Th><Th>Lớp</Th><Th>Điểm danh</Th><Th /></tr></thead>
            <tbody>{pageRows.map((r) => (
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
          </div>
          </>
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

