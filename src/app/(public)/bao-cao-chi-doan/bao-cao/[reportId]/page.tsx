import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/utils";
import { RichText } from "@/components/public/rich-text";

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const r = await db.chapterReport.findUnique({ where: { id: (await params).reportId }, include: { department: { select: { id: true, name: true } }, createdBy: { select: { fullName: true } } } });
  if (!r) notFound();
  return (
    <article className="w-full">
      <nav className="mb-3 text-[13px] text-muted"><Link href="/bao-cao-chi-doan" className="hover:text-primary">Báo cáo Chi đoàn</Link> › <Link href={`/bao-cao-chi-doan/${r.department.id}`} className="hover:text-primary">Chi đoàn {r.department.name}</Link></nav>
      <h1 className="text-2xl font-bold text-primary-dark">{r.title}</h1>
      <div className="mt-2 border-b border-border pb-3 text-sm text-muted">Chi đoàn {r.department.name} · {formatDate(r.createdAt)}{r.createdBy ? ` · ${r.createdBy.fullName}` : ""}</div>
      {r.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.imageUrl} alt="" className="my-5 w-full rounded-lg border border-border object-cover" />
      )}
      <div className="mt-5 rounded-lg bg-white/85 p-5"><RichText text={r.content} /></div>
    </article>
  );
}
