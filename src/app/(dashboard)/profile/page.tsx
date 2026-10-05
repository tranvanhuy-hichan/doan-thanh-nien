import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMemberForUser } from "@/lib/services/queries";
import { PageHeader, Section } from "@/components/ui/misc";
import { MemberProfile } from "@/components/members/member-profile";
import { MemberCard } from "@/components/members/member-card";
import { AvatarEditor } from "@/components/members/avatar-editor";

export const metadata = { title: "Hồ sơ & thẻ đoàn viên" };

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user.memberId) redirect("/dashboard");
  const member = await getMemberForUser(user, user.memberId);
  if (!member) redirect("/dashboard");
  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" />
      <MemberProfile member={member} />
      <Section title="Thẻ đoàn viên số" actions={<AvatarEditor />}>
        <MemberCard fullName={member.fullName} code={member.code} department={member.department.name} className={member.class.name}
          avatarUrl={member.avatarUrl} qrToken={member.qrToken} />
        <p className="mt-2 text-xs text-muted">Mã QR chỉ chứa mã định danh ngẫu nhiên, không chứa thông tin cá nhân.</p>
      </Section>
    </>
  );
}
