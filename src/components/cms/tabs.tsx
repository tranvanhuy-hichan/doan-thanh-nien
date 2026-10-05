import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/utils";

const TABS = [
  { href: "/cms/articles", label: "Bài viết" },
  { href: "/cms/pages", label: "Trang giới thiệu" },
  { href: "/chapter-reports", label: "Báo cáo Chi đoàn" },
  { href: "/cms/settings", label: "Thông tin website" },
];

/** Điều hướng con của khu quản lý website công khai. */
export function CmsTabs({ active }: { active: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 border-b border-border">
      <nav className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Quản lý website">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={cn("border-b-2 px-3 py-2 text-sm whitespace-nowrap", t.href === active ? "border-primary font-semibold text-primary-dark" : "border-transparent text-muted hover:text-foreground")}>{t.label}</Link>
        ))}
      </nav>
      <Link href="/" target="_blank" className="mb-1 inline-flex shrink-0 items-center gap-1 text-[13px] text-primary hover:underline"><ExternalLink className="size-3.5" /><span className="max-sm:hidden">Xem trang công khai</span></Link>
    </div>
  );
}
