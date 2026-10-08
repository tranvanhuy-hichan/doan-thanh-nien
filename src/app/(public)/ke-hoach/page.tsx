import { listArticles } from "@/lib/services/public";
import { pageParam } from "@/utils";
import { ArticleRow, EmptyPublic, PageTitle } from "@/components/public/blocks";
import { Pagination } from "@/components/ui/misc";

export const metadata = { title: "Kế hoạch" };
const PAGE_SIZE = 10;

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageParam((await searchParams).page);
  const { items, total } = await listArticles("PLAN", page, PAGE_SIZE);
  return (
    <>
      <PageTitle title="Kế hoạch" description="Kế hoạch công tác Đoàn" />
      <div className="rounded-lg border border-border bg-white/85 px-1.5">
        {items.length === 0 ? <EmptyPublic /> : items.map((a) => <ArticleRow key={a.id} a={a} />)}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/ke-hoach" params={{}} />
    </>
  );
}
