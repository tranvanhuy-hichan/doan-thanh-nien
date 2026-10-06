import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { verifyCheckinToken } from "@/lib/qr/token";
import { buttonClass } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/ui/misc";
import { Scanner } from "@/components/attendance/scanner";
import { ConfirmCheckin } from "@/components/attendance/confirm-checkin";

export const metadata = { title: "Quét QR điểm danh" };

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const user = await requireUser();
  const { t } = await searchParams;
  if (!user.memberId) {
    return (
      <>
        <PageHeader title="Quét QR điểm danh" />
        <Alert tone="amber">Chỉ tài khoản đoàn viên (kể cả bí thư) mới điểm danh bằng QR. Quản trị viên mở QR tại trang điểm danh của hoạt động.</Alert>
      </>
    );
  }

  let confirm: React.ReactNode = null;
  if (t) {
    const parsed = await verifyCheckinToken(t);
    const activity = parsed ? await db.activity.findUnique({ where: { id: parsed.activityId }, select: { title: true, qrNonce: true } }) : null;
    const member = user.memberId ? await db.member.findUnique({ where: { id: user.memberId }, include: { class: true } }) : null;
    confirm = activity && parsed && activity.qrNonce === parsed.nonce && member ? (
      <ConfirmCheckin token={t} activityTitle={activity.title} memberName={member.fullName} className={member.class.name} />
    ) : (
      <div className="max-w-md space-y-3">
        <Alert>Mã QR không hợp lệ hoặc đã hết hạn. Hãy quét lại mã đang hiển thị trên màn hình của Bí thư.</Alert>
        <Link href="/checkin" className={buttonClass("secondary")}>Quét lại</Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Quét QR điểm danh" description="Quét mã QR do Bí thư hiển thị tại hoạt động." />
      {confirm ?? <Scanner />}
    </>
  );
}
