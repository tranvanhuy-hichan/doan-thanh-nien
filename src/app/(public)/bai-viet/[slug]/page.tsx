import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { KIND_LABEL, KIND_PATH, getArticle } from "@/lib/services/public";
import { formatDate, formatDateTime } from "@/utils";
import { RichText } from "@/components/public/rich-text";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  return a ? { title: a.title, description: a.summary ?? undefined } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  return (
    <article className="w-full">
      <nav className="mb-3 text-[13px] text-muted"><Link href="/" className="hover:text-primary">Trang chủ</Link> › <Link href={KIND_PATH[a.kind]} className="hover:text-primary">{KIND_LABEL[a.kind]}</Link></nav>
      <h1 className="text-2xl font-bold text-primary-dark sm:text-3xl">{a.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-3 text-sm text-muted">
        {a.publishedAt && <span>{formatDate(a.publishedAt)}</span>}
        {a.author && <span>Đăng bởi {a.author.fullName}</span>}
        {a.eventAt && <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />{formatDateTime(a.eventAt)}</span>}
        {a.eventLocation && <span className="inline-flex items-center gap-1"><MapPin className="size-4" />{a.eventLocation}</span>}
      </div>
      {a.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.coverUrl} alt="" className="my-5 w-full rounded-lg border border-border object-cover" />
      )}
      {a.summary && <p className="my-5 text-lg font-medium text-slate-700">{a.summary}</p>}
      <div className="rounded-lg bg-white/85 p-5"><RichText text={a.content} /></div>
    </article>
  );
}
