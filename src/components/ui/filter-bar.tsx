"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input, Select } from "./form";

export type FilterField =
  | { type: "search"; name: string; placeholder: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[] }
  | { type: "month"; name: string };

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
        ) : (
          <label key={f.name} className="flex h-9 items-center gap-2 rounded-md border border-border bg-white pl-3 text-sm max-sm:min-w-[calc(50%-0.25rem)] max-sm:flex-1">
            <span className="text-muted">Tháng</span>
            <input type="month" aria-label="Tháng" value={sp.get(f.name) ?? ""} onChange={(e) => update(f.name, e.target.value)}
              className="h-full min-w-0 flex-1 rounded-r-md bg-transparent pr-2 outline-none" />
          </label>
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
