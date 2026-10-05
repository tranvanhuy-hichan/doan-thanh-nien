import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="w-full flex-1 px-4 py-6 lg:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
