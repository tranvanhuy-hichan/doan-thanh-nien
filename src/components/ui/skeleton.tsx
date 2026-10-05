import { cn } from "@/utils";

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded bg-slate-200/70", className)} />;

/** Khung chờ chung cho trang trong dashboard: tiêu đề, hàng số liệu, bảng. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-2 h-6 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="mb-8 grid max-w-xl grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => <div key={i}><Skeleton className="mb-2 h-3 w-16" /><Skeleton className="h-7 w-14" /></div>)}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-t border-border px-4 py-3.5">
            <Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/6" /><Skeleton className="h-4 w-1/6" /><Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
