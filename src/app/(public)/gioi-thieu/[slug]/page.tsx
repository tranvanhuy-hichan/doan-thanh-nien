import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_PAGES, getSitePage } from "@/lib/services/public";
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
    <div>
      <PageTitle title={SITE_PAGES[slug]} />
      <div className="rounded-lg border border-border bg-white/85 p-5">
        {page?.content.trim() ? <RichText text={page.content} /> : <p className="py-6 text-center text-sm text-muted">Nội dung đang được cập nhật.</p>}
      </div>
    </div>
  );
}
