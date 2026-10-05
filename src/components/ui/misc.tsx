import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn, initials } from "@/utils";
import { buttonClass } from "./button";
import { ResponsiveTable } from "./responsive-table";

const tones = {
  green: "bg-primary-light text-primary-dark",
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-indigo-50 text-indigo-700",
  amber: "bg-warning-light text-warning",
  red: "bg-danger-light text-danger",
} as const;
export type Tone = keyof typeof tones;

export function StatusBadge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone])}>{children}</span>;
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary-dark"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>
  );
}

export function PageHeader({ title, description, actions }: {
  title: string; description?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-x-3 gap-y-2 sm:items-start">
        <h1 className="min-w-0 text-xl font-semibold">{title}</h1>
        {actions && <div className="page-actions flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">{actions}</div>}
      </div>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
    </div>
  );
}

export function Section({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-border pt-5 mt-6 first:mt-0 first:border-0 first:pt-0", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <Inbox className="mb-2 size-8 text-slate-300" />
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Alert({ tone = "red", children }: { tone?: "red" | "amber" | "green"; children: React.ReactNode }) {
  const t = { red: "bg-danger-light text-danger border-red-200", amber: "bg-warning-light text-warning border-amber-200", green: "bg-primary-light text-primary-dark border-blue-200" }[tone];
  return <div className={cn("rounded-md border px-3 py-2 text-sm", t)} role="alert">{children}</div>;
}

/** Bảng dữ liệu: bọc để cuộn ngang trên màn hình nhỏ. */
export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white/85 max-sm:overflow-visible max-sm:border-0 max-sm:bg-transparent">
      <ResponsiveTable>{children}</ResponsiveTable>
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn("border-b border-border bg-slate-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase whitespace-nowrap", className)}>{children}</th>
);
export const Td = ({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={cn("border-b border-border px-4 py-2.5 align-middle", className)}>{children}</td>
);

export function Pagination({ page, pageSize, total, basePath, params }: {
  page: number; pageSize: number; total: number; basePath: string; params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("page", String(p));
    return `${basePath}?${sp}`;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  return (
    <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
      <span>{from}–{Math.min(page * pageSize, total)} / {total}</span>
      <div className="flex items-center gap-1">
        {page > 1 ? <Link href={href(page - 1)} className={buttonClass("secondary", "sm")}><ChevronLeft className="size-4" /></Link>
          : <span className={buttonClass("secondary", "sm", "opacity-40")}><ChevronLeft className="size-4" /></span>}
        <span className="px-2">Trang {page}/{pages}</span>
        {page < pages ? <Link href={href(page + 1)} className={buttonClass("secondary", "sm")}><ChevronRight className="size-4" /></Link>
          : <span className={buttonClass("secondary", "sm", "opacity-40")}><ChevronRight className="size-4" /></span>}
      </div>
    </div>
  );
}
