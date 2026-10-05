"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/form";
import { PERIOD_LABEL, type PeriodType } from "@/lib/emulation-period";

export function PeriodFilter({ type, value, options }: { type: PeriodType; value: string; options: Record<PeriodType, { value: string; label: string }[]> }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const go = (t: PeriodType, v: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set("type", t); next.set("value", v); next.delete("page");
    start(() => router.replace(`${pathname}?${next}`));
  };
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="grid grid-cols-4 overflow-hidden rounded-md border border-border bg-white sm:inline-flex" role="tablist">
        {(Object.keys(PERIOD_LABEL) as PeriodType[]).map((t) => (
          <button key={t} role="tab" aria-selected={t === type} onClick={() => go(t, options[t][0].value)}
            className={`px-2 py-2 text-[13px] sm:px-3.5 sm:py-1.5 sm:text-sm ${t === type ? "bg-primary font-medium text-white" : "hover:bg-slate-50"}`}>{PERIOD_LABEL[t]}</button>
        ))}
      </div>
      <Select value={value} onChange={(e) => go(type, e.target.value)} className="w-full sm:w-auto sm:min-w-64" aria-label="Kỳ thi đua">
        {!options[type].some((o) => o.value === value) && <option value={value}>{value}</option>}
        {options[type].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    </div>
  );
}
