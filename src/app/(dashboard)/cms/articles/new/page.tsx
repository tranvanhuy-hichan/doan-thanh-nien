import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { ArticleForm } from "@/components/cms/forms";

export const metadata = { title: "Đăng bài" };

export default async function NewArticlePage() {
  await requireRole(["ADMIN"]);
  return (<><PageHeader title="Đăng bài" description="Bài hiển thị trên trang công khai của Đoàn trường." /><ArticleForm /></>);
}
