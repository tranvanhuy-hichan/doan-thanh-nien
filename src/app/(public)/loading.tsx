import { Skeleton } from "@/components/ui/skeleton";

/** Khung chờ cho trang công khai: header và thanh bên giữ nguyên, chỉ phần nội dung hiện khung xám. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-5 h-4 w-80 max-w-full" />
      <div className="rounded-lg border border-border bg-white/85 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 border-b border-border py-3 last:border-0">
            <Skeleton className="hidden h-24 w-36 shrink-0 sm:block" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
