import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_PAGES, getSitePage } from "@/lib/services/public";
import { cn } from "@/utils";
import { PageTitle } from "@/components/public/blocks";
import { RichText } from "@/components/public/rich-text";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return SITE_PAGES[slug] ? { title: SITE_PAGES[slug] } : {};
}

export default async function IntroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SITE_PAGES[slug]) notFound();
  const page = await getSitePage(slug);
  return (
    <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <aside>
        <h2 className="mb-2 border-l-4 border-primary pl-3 text-sm font-bold tracking-wide text-primary-dark uppercase">Giới thiệu</h2>
        <ul className="rounded-lg border border-border bg-white/85">
          {Object.entries(SITE_PAGES).map(([s, t]) => (
            <li key={s} className="border-b border-border last:border-0">
              <Link href={`/gioi-thieu/${s}`} className={cn("block px-4 py-2.5 text-sm hover:bg-primary-light", s === slug && "bg-primary-light font-semibold text-primary-dark")}>{t}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <div>
        <PageTitle title={SITE_PAGES[slug]} />
        <div className="rounded-lg border border-border bg-white/85 p-5">
          {page?.content.trim() ? <RichText text={page.content} /> : <p className="py-6 text-center text-sm text-muted">Nội dung đang được cập nhật.</p>}
        </div>
      </div>
    </div>
  );
}
