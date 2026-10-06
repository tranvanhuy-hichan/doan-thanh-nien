"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, RotateCcw } from "lucide-react";
import { resetSchoolYearAction, saveSchoolYearAction } from "@/actions/school-year";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { ConfirmButton, Modal } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";
import { DataTable, StatusBadge, Td, Th } from "@/components/ui/misc";
import { schoolYearOf, weekLabel, yearLabel, type SchoolCalendar } from "@/lib/school-calendar";

type Row = SchoolCalendar & { custom: boolean };

function FormButton({ row }: { row?: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const base = row ?? { startYear: schoolYearOf() + 1, week1Start: `${schoolYearOf() + 1}-09-05`, sem1Weeks: 18, totalWeeks: 35 };
  const [v, setV] = useState({ startYear: String(base.startYear), week1Start: base.week1Start, sem1Weeks: String(base.sem1Weeks), totalWeeks: String(base.totalWeeks) });
  const [busy, setBusy] = useState(false);
  const cal: SchoolCalendar = { startYear: +v.startYear, week1Start: v.week1Start, sem1Weeks: +v.sem1Weeks || 1, totalWeeks: +v.totalWeeks || 1 };
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(v.week1Start) && cal.totalWeeks > cal.sem1Weeks;
  return (
    <>
      <Button variant={row ? "ghost" : "primary"} size={row ? "sm" : "md"} onClick={() => setOpen(true)} aria-label={row ? "Sửa" : "Thêm năm học"}>
        {row ? <Pencil className="size-3.5" /> : <><Plus className="size-4" />Thêm năm học</>}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={row ? `Lịch năm học ${yearLabel(row.startYear)}` : "Thêm năm học"} className="max-w-md">
        <div className="space-y-3">
          <Field label="Năm học bắt đầu" hint={`Năm học ${yearLabel(+v.startYear || 0)}`}><Input type="number" value={v.startYear} disabled={!!row} onChange={(e) => setV({ ...v, startYear: e.target.value })} /></Field>
          <Field label="Ngày bắt đầu Tuần 1" required><Input type="date" value={v.week1Start} onChange={(e) => setV({ ...v, week1Start: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số tuần học kỳ 1"><Input type="number" min={1} value={v.sem1Weeks} onChange={(e) => setV({ ...v, sem1Weeks: e.target.value })} /></Field>
            <Field label="Tổng số tuần cả năm"><Input type="number" min={2} max={52} value={v.totalWeeks} onChange={(e) => setV({ ...v, totalWeeks: e.target.value })} /></Field>
          </div>
          {valid && (
            <p className="rounded-md bg-primary-light px-3 py-2 text-xs text-primary-dark">
              {weekLabel(cal, 1)} · HK1 kết thúc: {weekLabel(cal, cal.sem1Weeks)} · {cal.totalWeeks > cal.sem1Weeks ? `HK2: ${weekLabel(cal, cal.sem1Weeks + 1)} → ${weekLabel(cal, cal.totalWeeks)}` : ""}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button loading={busy} disabled={!valid} onClick={async () => {
              setBusy(true);
              const res = await saveSchoolYearAction({ startYear: +v.startYear, week1Start: v.week1Start, sem1Weeks: +v.sem1Weeks, totalWeeks: +v.totalWeeks });
              setBusy(false);
              if (reportResult(res)) { setOpen(false); router.refresh(); }
            }}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function SchoolYearManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Lịch giáo dục tính theo tuần: Tuần 1 bắt đầu từ ngày bạn đặt. Các bộ lọc "Năm học → Tuần" trong hệ thống dùng lịch này.</p>
        <FormButton />
      </div>
      <DataTable>
        <thead><tr><Th>Năm học</Th><Th>Tuần 1 bắt đầu</Th><Th className="text-right">HK1</Th><Th className="text-right">Tổng tuần</Th><Th>Nguồn</Th><Th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.startYear}>
            <Td className="font-medium">{yearLabel(r.startYear)}</Td>
            <Td className="whitespace-nowrap">{r.week1Start.split("-").reverse().join("/")}</Td>
            <Td className="text-right tabular-nums">{r.sem1Weeks} tuần</Td>
            <Td className="text-right tabular-nums">{r.totalWeeks} tuần</Td>
            <Td><StatusBadge tone={r.custom ? "green" : "gray"}>{r.custom ? "Đã đặt" : "Mặc định"}</StatusBadge></Td>
            <Td className="text-right whitespace-nowrap">
              <FormButton row={r} />
              {r.custom && <ConfirmButton triggerVariant="ghost" triggerLabel="Đặt lại mặc định" trigger={<RotateCcw className="size-3.5" />} title="Đặt lại mặc định?" description="Quay về Tuần 1 bắt đầu 05/09, 18 tuần học kỳ 1, 35 tuần cả năm." confirmLabel="Đặt lại"
                onConfirm={async () => { reportResult(await resetSchoolYearAction(r.startYear)); router.refresh(); }} />}
            </Td>
          </tr>
        ))}</tbody>
      </DataTable>
    </>
  );
}
