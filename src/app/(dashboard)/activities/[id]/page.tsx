import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { canManageActivity } from "@/lib/permissions";
import { activityScope } from "@/lib/services/queries";
import { activityStatus, canOpenCheckin } from "@/lib/services/activity-status";
import { formatDate, formatDateTime, formatTime } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { Alert, PageHeader, Section } from "@/components/ui/misc";
import { ActivityStatusBadge } from "@/components/activities/status-badge";
import { AttendanceLink, ManageActivityActions, RegisterButton } from "@/components/activities/activity-actions";

export const metadata = { title: "Chi tiết hoạt động" };

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const a = await db.activity.findFirst({
    where: { id, ...activityScope(user) }, // đoàn viên/bí thư không xem được hoạt động của Chi đoàn khác
    include: { category: true, department: true, createdBy: { select: { fullName: true } },
      _count: { select: { attendances: true, registrations: { where: { status: "REGISTERED" } } } } },
  });
  if (!a) notFound();

  const status = activityStatus(a);
  const manage = canManageActivity(user, a);
  const [myReg, myAtt] = user.memberId ? await Promise.all([
    db.activityRegistration.findUnique({ where: { activityId_memberId: { activityId: id, memberId: user.memberId } } }),
    db.attendance.findUnique({ where: { activityId_memberId: { activityId: id, memberId: user.memberId } } }),
  ]) : [null, null];

  const registered = myReg?.status === "REGISTERED";
  const full = !!a.maxParticipants && a._count.registrations >= a.maxParticipants;
  const sameDay = formatDate(a.startAt) === formatDate(a.endAt);

  return (
    <>
      <PageHeader title={a.title} actions={manage && <ManageActivityActions id={a.id} cancelled={!!a.cancelledAt} hasAttendance={a._count.attendances > 0} />} />
      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2 text-sm text-muted">
        <ActivityStatusBadge status={status} /><span>{a.category.name}</span><span>·</span><span>{a.department ? `Chi đoàn ${a.department.name}` : "Toàn trường"}</span>
      </div>

      {a.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.imageUrl} alt={a.title} className="mb-6 max-h-72 w-full rounded-lg border border-border object-cover" />
      )}

      <dl className="space-y-2 text-[15px]">
        <div className="flex items-center gap-3"><CalendarDays className="size-4 text-muted" /><dd>{sameDay ? formatDate(a.startAt) : `${formatDate(a.startAt)} – ${formatDate(a.endAt)}`}</dd></div>
        <div className="flex items-center gap-3"><Clock className="size-4 text-muted" /><dd>{formatTime(a.startAt)} - {formatTime(a.endAt)}</dd></div>
        <div className="flex items-center gap-3"><MapPin className="size-4 text-muted" /><dd>{a.location}</dd></div>
        <div className="flex items-center gap-3"><Star className="size-4 text-muted" /><dd>{a.points} điểm hoạt động{a.volunteerHours > 0 ? ` · ${a.volunteerHours} giờ tình nguyện` : ""}</dd></div>
      </dl>

      <Section title="Mô tả" className="mt-6">
        {a.description ? <p className="max-w-3xl whitespace-pre-line">{a.description}</p> : <p className="text-muted">Chưa có mô tả.</p>}
      </Section>

      <Section title="Thông tin tham gia">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-lg font-semibold"><Users className="size-5 text-muted" />
            {a._count.registrations}{a.maxParticipants ? ` / ${a.maxParticipants}` : ""} <span className="text-sm font-normal text-muted">người đăng ký · {a._count.attendances} đã điểm danh</span>
          </div>
          {user.role === "MEMBER" && !myAtt && (status === "UPCOMING" || status === "ONGOING") && (
            <RegisterButton activityId={a.id} registered={registered} disabled={!registered && full} reason={full ? "Hoạt động đã đủ số lượng" : undefined} />
          )}
        </div>
        {registered && !myAtt && <p className="mt-2 text-sm text-primary">Bạn đã đăng ký tham gia hoạt động này.</p>}
      </Section>

      <Section title="Điểm danh">
        {user.role === "MEMBER" ? (
          myAtt ? <Alert tone="green">Bạn đã điểm danh lúc {formatDateTime(myAtt.checkedInAt)}.</Alert>
          : a.checkinOpen && status !== "CANCELLED" ? (
            <div className="flex items-center gap-3"><p className="text-sm">Điểm danh đang mở. Quét mã QR tại hoạt động để xác nhận tham gia.</p><Link href="/checkin" className={buttonClass()}>Quét QR</Link></div>
          ) : <p className="text-sm text-muted">{status === "CANCELLED" ? "Hoạt động đã bị hủy." : "Điểm danh chưa mở. Bí thư sẽ mở khi hoạt động bắt đầu."}</p>
        ) : manage ? (
          <div className="flex flex-wrap items-center gap-3">
            <AttendanceLink id={a.id} label={a.checkinOpen ? "Quản lý điểm danh (đang mở)" : "Mở điểm danh"} />
            {!canOpenCheckin(a) && !a.checkinOpen && <span className="text-sm text-muted">Chỉ mở được từ 60 phút trước giờ bắt đầu.</span>}
          </div>
        ) : <p className="text-sm text-muted">Hoạt động toàn trường do Ban chấp hành Đoàn trường quản lý điểm danh.</p>}
      </Section>
      <p className="mt-8 text-xs text-muted">Người tạo: {a.createdBy.fullName}</p>
    </>
  );
}
