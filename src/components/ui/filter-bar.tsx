"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input, Select } from "./form";
import { currentWeek, schoolYearOf, weekLabel, yearLabel, type SchoolCalendar } from "@/lib/school-calendar";

/** Lọc theo NĂM HỌC rồi TUẦN (hoặc học kỳ / cả năm học). Tuần hiện thị kèm ngày tháng, ví dụ "Tuần 1 (05/09 – 11/09)". */
function SchoolWeekFilter({ calendars, nh, tuan, onChange }: { calendars: SchoolCalendar[]; nh: string; tuan: string; onChange: (nh: string, tuan: string) => void }) {
  const cur = schoolYearOf();
  const cal = calendars.find((c) => String(c.startYear) === nh);
  const nowWeek = cal ? currentWeek(cal) : null;
  const cls = "max-sm:min-w-[calc(50%-0.25rem)] max-sm:flex-1";
  const week = (n: number) => <option key={n} value={String(n)}>{weekLabel(cal!, n)}{n === nowWeek ? " · hiện tại" : ""}</option>;
  return (
    <>
      <Select aria-label="Năm học" value={nh} onChange={(e) => onChange(e.target.value, tuan)} className={`w-auto min-w-36 ${cls}`}>
        {calendars.map((c) => <option key={c.startYear} value={c.startYear}>Năm học {yearLabel(c.startYear)}{c.startYear === cur ? " (hiện tại)" : ""}</option>)}
      </Select>
      <Select aria-label="Tuần" value={tuan} onChange={(e) => onChange(nh, e.target.value)} className={`w-auto min-w-52 ${cls}`}>
        <option value="">Cả năm học</option>
        {cal && (
          <>
            <option value="hk1">Học kỳ 1 (Tuần 1–{cal.sem1Weeks})</option>
            <option value="hk2">Học kỳ 2 (Tuần {cal.sem1Weeks + 1}–{cal.totalWeeks})</option>
            <optgroup label="Học kỳ 1">{Array.from({ length: cal.sem1Weeks }, (_, i) => week(i + 1))}</optgroup>
            <optgroup label="Học kỳ 2">{Array.from({ length: cal.totalWeeks - cal.sem1Weeks }, (_, i) => week(cal.sem1Weeks + i + 1))}</optgroup>
          </>
        )}
      </Select>
    </>
  );
}

/** Lọc theo Tháng + Năm tách riêng. Chỉ chọn năm = cả năm; giá trị: `YYYY` hoặc `YYYY-MM`. */
function MonthYearFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [year, month] = value.split("-");
  const now = new Date();
  const years = Array.from({ length: 6 }, (_, i) => String(now.getFullYear() + 1 - i));
  if (year && !years.includes(year)) years.push(year);
  const compose = (y: string, m: string) => (!y && !m ? "" : `${y || now.getFullYear()}${m ? `-${m}` : ""}`);
  const cls = "max-sm:min-w-[calc(50%-0.25rem)] max-sm:flex-1";
  return (
    <>
      <Select aria-label="Tháng" value={month ?? ""} onChange={(e) => onChange(compose(year ?? "", e.target.value))} className={`w-auto min-w-28 ${cls}`}>
        <option value="">Tháng</option>
        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => <option key={m} value={m}>Tháng {+m}</option>)}
      </Select>
      <Select aria-label="Năm" value={year ?? ""} onChange={(e) => onChange(compose(e.target.value, month ?? ""))} className={`w-auto min-w-28 ${cls}`}>
        <option value="">Năm</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </Select>
    </>
  );
}

export type FilterField =
  | { type: "search"; name: string; placeholder: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[] }
  | { type: "month"; name: string }
  /** Lọc theo năm học + tuần/học kỳ (URL: ?nh=2026&tuan=3|hk1|hk2). `name` luôn là "nh". */
  | { type: "schoolweek"; name: "nh"; calendars: SchoolCalendar[] };

/** Bộ lọc đồng bộ với URL (search params) -> render phía server, có thể chia sẻ link. */
export function FilterBar({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchField = fields.find((f) => f.type === "search");
  const [q, setQ] = useState(searchField ? sp.get(searchField.name) ?? "" : "");

  useEffect(() => () => clearTimeout(timer.current), []);

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(name, value); else next.delete(name);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next}`));
  };
  const active = fields.some((f) => sp.get(f.name));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {fields.map((f) =>
        f.type === "search" ? (
          <div key={f.name} className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-400" />
            <Input value={q} placeholder={f.placeholder} className="pl-8"
              onChange={(e) => { setQ(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => update(f.name, e.target.value.trim()), 350); }} />
          </div>
        ) : f.type === "select" ? (
          <Select key={f.name} aria-label={f.label} value={sp.get(f.name) ?? ""} onChange={(e) => update(f.name, e.target.value)} className="w-auto min-w-36 max-sm:min-w-[calc(50%-0.25rem)] max-sm:flex-1">
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ) : f.type === "schoolweek" ? (
          <SchoolWeekFilter key="schoolweek" calendars={f.calendars} nh={sp.get("nh") || String(schoolYearOf())} tuan={sp.get("tuan") ?? ""}
            onChange={(nh, tuan) => {
              const next = new URLSearchParams(sp.toString());
              if (nh) next.set("nh", nh); else next.delete("nh");
              if (nh && tuan) next.set("tuan", tuan); else next.delete("tuan");
              next.delete("page");
              start(() => router.replace(`${pathname}?${next}`));
            }} />
        ) : (
          <MonthYearFilter key={f.name} value={sp.get(f.name) ?? ""} onChange={(v) => update(f.name, v)} />
        ),
      )}
      {active && (
        <button className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-foreground"
          onClick={() => { setQ(""); start(() => router.replace(pathname)); }}>
          <X className="size-3.5" />Xóa lọc
        </button>
      )}
    </div>
  );
}
