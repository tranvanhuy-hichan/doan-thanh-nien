import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/misc";
import { PollForm } from "@/components/polls/poll-form";

export const metadata = { title: "Tạo bình chọn" };

export default async function NewPollPage() {
  await requireRole(["ADMIN"]);
  return (<><PageHeader title="Tạo bình chọn" description="Đoàn viên sẽ nhận thông báo và bỏ phiếu trong mục Bình chọn." /><PollForm /></>);
}
