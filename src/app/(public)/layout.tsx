import { Suspense } from "react";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { PublicSidebar } from "@/components/public/public-sidebar";
import { departmentsByGrade } from "@/lib/services/public";
import { getMarquee, getSiteSettings } from "@/lib/services/site-settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, groups, marquee] = await Promise.all([getSiteSettings(), departmentsByGrade(), getMarquee()]);
  const grades = groups.map(([grade, depts]) => ({ grade, depts: depts.map((d) => ({ id: d.id, name: d.name })) }));
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader address={settings.address} bannerUrl={settings.bannerUrl} phone={settings.phone} email={settings.email} facebook={settings.facebook} youtube={settings.youtube} marquee={marquee} />
      <div className="flex w-full flex-1 gap-6 px-4 py-6 lg:px-8">
        {/* Thanh bên trái (desktop): Giới thiệu, Báo cáo Chi đoàn theo khối/lớp, Thi đua. Trên mobile dùng menu ở đầu trang. */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-32"><Suspense><PublicSidebar grades={grades} /></Suspense></div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <SiteFooter address={settings.address} phone={settings.phone} email={settings.email} />
    </div>
  );
}
