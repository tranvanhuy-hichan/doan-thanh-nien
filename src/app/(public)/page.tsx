import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Trophy } from "lucide-react";
import { emulationRanking } from "@/lib/services/emulation";
import { currentValue, resolvePeriod } from "@/lib/emulation-period";
import { latestArticles, upcomingActivities, articleHref } from "@/lib/services/public";
import { formatDate, formatDateTime, formatTime } from "@/utils";
import { ArticleRow, Block, EmptyPublic } from "@/components/public/blocks";

export const revalidate = 60; // trang chủ cache 60 giây

export default async function HomePage() {
  const period = resolvePeriod("month", currentValue("month"))!;
  const [news, events, announcements, plans, upcoming, ranking] = await Promise.all([
    latestArticles("NEWS", 6), latestArticles("EVENT", 4), latestArticles("ANNOUNCEMENT", 6), latestArticles("PLAN", 4),
    upcomingActivities(5), emulationRanking(period),
  ]);
  const [featured, ...restNews] = news;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Block title="Tin tức" href="/tin-tuc">
            {news.length === 0 ? <EmptyPublic text="Chưa có tin tức." /> : (
              <>
                {featured && (
                  <Link href={articleHref(featured.slug)} className="group mb-3 block">
                    {featured.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={featured.coverUrl} alt="" className="mb-3 aspect-video w-full rounded-lg object-cover" />
                    )}
                    <h3 className="text-lg font-bold group-hover:text-primary">{featured.title}</h3>
                    <p className="text-xs text-muted">{featured.publishedAt && formatDate(featured.publishedAt)}</p>
                    {featured.summary && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{featured.summary}</p>}
                  </Link>
                )}
                {restNews.map((a) => <ArticleRow key={a.id} a={a} />)}
              </>
            )}
          </Block>

          <div className="grid gap-6 md:grid-cols-2">
            <Block title="Sự kiện" href="/su-kien">
              {events.length === 0 ? <EmptyPublic text="Chưa có sự kiện." /> : events.map((a) => <ArticleRow key={a.id} a={{ ...a, coverUrl: null }} />)}
            </Block>
            <Block title="Kế hoạch" href="/ke-hoach">
              {plans.length === 0 ? <EmptyPublic text="Chưa có kế hoạch." /> : plans.map((a) => <ArticleRow key={a.id} a={{ ...a, coverUrl: null }} />)}
            </Block>
          </div>
        </div>

        <aside className="space-y-6">
          <Block title="Thông báo" href="/thong-bao">
            {announcements.length === 0 ? <EmptyPublic text="Chưa có thông báo." /> : (
              <ul className="divide-y divide-border">
                {announcements.map((a) => (
                  <li key={a.id} className="py-2">
                    <Link href={articleHref(a.slug)} className="line-clamp-2 text-sm font-medium hover:text-primary">{a.title}</Link>
                    <span className="text-xs text-muted">{a.publishedAt && formatDate(a.publishedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Hoạt động sắp tới" href="/lich-hoat-dong">
            {upcoming.length === 0 ? <EmptyPublic text="Chưa có hoạt động sắp tới." /> : (
              <ul className="space-y-3">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-md bg-primary-light py-1 text-primary-dark">
                      <span className="text-lg leading-none font-bold">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(a.startAt)}</span>
                      <span className="text-[10px] uppercase">Th{new Intl.DateTimeFormat("vi-VN", { month: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(a.startAt)}</span>
                    </div>
                    <div className="min-w-0 text-sm">
                      <div className="line-clamp-2 font-medium">{a.title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted"><CalendarDays className="size-3" />{formatTime(a.startAt)} · {a.department?.name ? `Chi đoàn ${a.department.name}` : "Toàn trường"}</div>
                      <div className="flex items-center gap-1 text-xs text-muted"><MapPin className="size-3" />{a.location}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title={`Thi đua ${period.label.toLowerCase()}`} href="/thi-dua">
            <ol className="space-y-2">
              {ranking.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <span className={`flex size-7 items-center justify-center rounded-full text-[13px] font-bold ${r.rank === 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>{r.rank}</span>
                  <span className="flex-1 font-medium">Chi đoàn {r.name}</span>
                  <span className="font-semibold tabular-nums">{r.total}</span>
                </li>
              ))}
              {ranking.length === 0 && <EmptyPublic text="Chưa có dữ liệu." />}
            </ol>
            <Link href="/thi-dua/chi-doan-tieu-bieu" className="mt-3 inline-flex items-center gap-1 text-[13px] text-primary hover:underline"><Trophy className="size-3.5" />Chi đoàn tiêu biểu <ArrowRight className="size-3.5" /></Link>
          </Block>
        </aside>
      </div>
    </div>
  );
}
