import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatDate, formatDateTime } from "@/utils";
import { KIND_LABEL, articleHref } from "@/lib/services/public";
import type { ArticleKind } from "@prisma/client";
import { cn } from "@/utils";

/** Tiêu đề khối có vạch xanh bên trái, giống bố cục trang trường. */
export function Block({ title, href, children, className }: { title: string; href?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-white/85", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="border-l-4 border-primary pl-3 text-[15px] font-bold tracking-wide text-primary-dark uppercase">{title}</h2>
        {href && <Link href={href} className="text-[13px] text-primary hover:underline">Xem tất cả</Link>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5 border-b-2 border-primary pb-2">
      <h1 className="text-2xl font-bold text-primary-dark">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}

export type CardArticle = { id: string; kind: ArticleKind; title: string; slug: string; summary: string | null; coverUrl: string | null; publishedAt: Date | null; eventAt: Date | null; eventLocation: string | null };

export function ArticleRow({ a, showKind }: { a: CardArticle; showKind?: boolean }) {
  return (
    <article className="flex gap-3 border-b border-border py-3 last:border-0">
      {a.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.coverUrl} alt="" loading="lazy" className="h-20 w-28 shrink-0 rounded-md object-cover sm:h-24 sm:w-36" />
      )}
      <div className="min-w-0 flex-1">
        <Link href={articleHref(a.slug)} className="line-clamp-2 font-semibold hover:text-primary">{a.title}</Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          {showKind && <span className="rounded bg-primary-light px-1.5 py-0.5 font-medium text-primary-dark">{KIND_LABEL[a.kind]}</span>}
          {a.publishedAt && <span>{formatDate(a.publishedAt)}</span>}
          {a.kind === "EVENT" && a.eventAt && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{formatDateTime(a.eventAt)}</span>}
          {a.kind === "EVENT" && a.eventLocation && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{a.eventLocation}</span>}
        </div>
        {a.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.summary}</p>}
      </div>
    </article>
  );
}

export function EmptyPublic({ text = "Chưa có nội dung." }: { text?: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}
