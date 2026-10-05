import { requireRole } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/services/site-settings";
import { PageHeader } from "@/components/ui/misc";
import { CmsTabs } from "@/components/cms/tabs";
import { SiteSettingsForm } from "@/components/cms/site-settings-form";

export const metadata = { title: "Thông tin website" };

export default async function CmsSettingsPage() {
  await requireRole(["ADMIN"]);
  return (
    <>
      <PageHeader title="Website công khai" description="Thông tin chung hiển thị trên trang chủ và chân trang" />
      <CmsTabs active="/cms/settings" />
      <SiteSettingsForm initial={await getSiteSettings()} />
    </>
  );
}
