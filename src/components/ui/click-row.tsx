"use client";
import { useRouter } from "next/navigation";
import { cn } from "@/utils";

/** Hàng bảng bấm vào đâu cũng mở chi tiết (trừ link/nút/hộp thoại bên trong; Ctrl/⌘+bấm mở tab mới). */
export function ClickRow({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr className={cn("cursor-pointer hover:bg-slate-50", className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button, input, select, textarea, label, [role=dialog], [data-no-row]")) return;
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank"); else router.push(href);
      }}>
      {children}
    </tr>
  );
}
