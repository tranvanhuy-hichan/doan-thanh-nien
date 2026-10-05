"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/form";
import { PERIOD_LABEL, currentValue, resolvePeriod, schoolYearStart, weekValue, type PeriodType } from "@/lib/emulation-period";

const pad = (n: number) => String(n).padStart(2, "0");
const cell = "w-full sm:w-auto sm:min-w-40";

/** Số tuần ISO của năm y (tuần chứa ngày 28/12). */
function weeksIn(y: number) {
  return Number(weekValue(new Date(Date.UTC(y, 11, 28))).split("-W")[1]);
}

export function PeriodFilter({ type, value }: { type: PeriodType; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const nowYear = new Date().getFullYear();
  const calYears = Array.from({ length: 6 }, (_, i) => nowYear + 1 - i);
  const schoolYears = Array.from({ length: 5 }, (_, i) => schoolYearStart(new Date()) + 1 - i);

  const go = (t: PeriodType, v: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set("type", t); next.set("value", v); next.delete("page");
    start(() => router.replace(`${pathname}?${next}`));
  };

  let controls: React.ReactNode;
  if (type === "month") {
    const [y, m] = value.split("-").map(Number);
    controls = (
      <>
        <Select aria-label="Tháng" value={m} onChange={(e) => go("month", `${y}-${pad(+e.target.value)}`)} className={cell}>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Tháng {i + 1}</option>)}
        </Select>
        <Select aria-label="Năm" value={y} onChange={(e) => go("month", `${e.target.value}-${pad(m)}`)} className={cell}>
          {[...new Set([...calYears, y])].map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </>
    );
  } else if (type === "week") {
    const [ys, ws] = value.split("-W");
    const y = Number(ys), w = Number(ws);
    const goWeek = (yy: number, ww: number) => go("week", `${yy}-W${pad(Math.min(ww, weeksIn(yy)))}`);
    controls = (
      <>
        <Select aria-label="Tuần" value={w} onChange={(e) => goWeek(y, +e.target.value)} className={cell}>
          {Array.from({ length: weeksIn(y) }, (_, i) => {
            const label = resolvePeriod("week", `${y}-W${pad(i + 1)}`)?.label ?? `Tuần ${i + 1}`;
            return <option key={i} value={i + 1}>{label.replace(/\/\d{4}\)$/, ")")}</option>;
          })}
        </Select>
        <Select aria-label="Năm" value={y} onChange={(e) => goWeek(+e.target.value, w)} className={cell}>
          {[...new Set([...calYears, y])].map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </>
    );
  } else if (type === "semester") {
    const [y, t] = value.split("-").map(Number);
    controls = (
      <>
        <Select aria-label="Học kỳ" value={t} onChange={(e) => go("semester", `${y}-${e.target.value}`)} className={cell}>
          <option value={1}>Học kỳ 1</option><option value={2}>Học kỳ 2</option>
        </Select>
        <Select aria-label="Năm học" value={y} onChange={(e) => go("semester", `${e.target.value}-${t}`)} className={cell}>
          {[...new Set([...schoolYears, y])].map((v) => <option key={v} value={v}>Năm học {v}–{v + 1}</option>)}
        </Select>
      </>
    );
  } else {
    const y = Number(value);
    controls = (
      <Select aria-label="Năm học" value={y} onChange={(e) => go("year", e.target.value)} className={`${cell} col-span-2 sm:col-span-1`}>
        {[...new Set([...schoolYears, y])].map((v) => <option key={v} value={v}>Năm học {v}–{v + 1}</option>)}
      </Select>
    );
  }

  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="grid grid-cols-4 overflow-hidden rounded-md border border-border bg-white sm:inline-flex" role="tablist">
        {(Object.keys(PERIOD_LABEL) as PeriodType[]).map((t) => (
          <button key={t} role="tab" aria-selected={t === type} onClick={() => go(t, currentValue(t))}
            className={`px-2 py-2 text-[13px] sm:px-3.5 sm:py-1.5 sm:text-sm ${t === type ? "bg-primary font-medium text-white" : "hover:bg-slate-50"}`}>{PERIOD_LABEL[t]}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">{controls}</div>
    </div>
  );
}
