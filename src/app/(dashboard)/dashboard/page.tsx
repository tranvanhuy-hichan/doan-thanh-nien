import Link from "next/link";
import { CompactList } from "@/components/ui/compact-list";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { activityScope, participationRate } from "@/lib/services/queries";
import { activityStatus } from "@/lib/services/activity-status";
import { departmentRanking, monthlyParticipation } from "@/lib/services/stats";
import { formatDate, formatDateTime, formatHours, formatNumber, formatTime } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { DataTable, EmptyState, PageHeader, Section, Stat, Td, Th } from "@/components/ui/misc";
import { ParticipationChart } from "@/components/charts/participation-chart";
import { ActivityStatusBadge } from "@/components/activities/status-badge";
import { BadgeIcon } from "@/components/members/badge-icon";

export const metadata = { title: "Tổng quan" };

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") return <AdminDashboard />;
  if (user.role === "SECRETARY") return <SecretaryDashboard departmentId={user.departmentId} name={user.departmentName} />;
  return <MemberDashboard user={user} />;
}

async function AdminDashboard() {
  const [members, departments, activities, monthly, ranking, recent] = await Promise.all([
    db.member.count({ where: { status: "ACTIVE" } }),
    db.department.count(),
    db.activity.count({ where: { cancelledAt: null } }),
    monthlyParticipation(),
    departmentRanking(),
    db.activity.findMany({ orderBy: { startAt: "desc" }, take: 6, include: { department: true, _count: { select: { attendances: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Tổng quan" description="Số liệu toàn trường" />
      <div className="grid grid-cols-3 gap-6 sm:max-w-xl">
        <Stat label="Đoàn viên" value={formatNumber(members)} />
        <Stat label="Chi đoàn" value={formatNumber(departments)} />
        <Stat label="Hoạt động" value={formatNumber(activities)} />
      </div>
      <Section title="Tỷ lệ tham gia hoạt động (6 tháng gần nhất)" className="mt-8">
        <ParticipationChart data={monthly} />
      </Section>
      <Section title="Hoạt động gần đây" actions={<Link href="/activities" className="text-[13px] text-primary hover:underline">Xem tất cả</Link>}>
        <RecentTable rows={recent} />
      </Section>
      <Section title="Chi đoàn có tỷ lệ tham gia cao">
        {ranking.length === 0 ? <EmptyState title="Chưa có Chi đoàn" /> : (
          <>
          <CompactList items={ranking.slice(0, 5).map((d, i) => ({ id: d.id, rank: i + 1, title: `Chi đoàn ${d.name}`, value: `${d.rate}%`, href: `/departments/${d.id}`, hrefLabel: "Xem Chi đoàn",
            details: [["Đoàn viên", d.members], ["Lượt tham gia", d.attended], ["Tỷ lệ tham gia", `${d.rate}%`]] }))} />
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>#</Th><Th>Chi đoàn</Th><Th className="text-right">Đoàn viên</Th><Th className="text-right">Lượt tham gia</Th><Th className="text-right">Tỷ lệ</Th></tr></thead>
            <tbody>{ranking.slice(0, 5).map((d, i) => (
              <tr key={d.id}><Td>{i + 1}</Td><Td><Link href={`/departments/${d.id}`} className="font-medium hover:text-primary">{d.name}</Link></Td>
                <Td className="text-right tabular-nums">{d.members}</Td><Td className="text-right tabular-nums">{d.attended}</Td><Td className="text-right font-medium tabular-nums">{d.rate}%</Td></tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
      </Section>
    </>
  );
}

function RecentTable({ rows }: { rows: { id: string; title: string; startAt: Date; endAt: Date; cancelledAt: Date | null; department: { name: string } | null; _count: { attendances: number } }[] }) {
  if (!rows.length) return <EmptyState title="Chưa có hoạt động" />;
  return (
    <>
    <CompactList items={rows.map((a) => ({
      id: a.id, title: a.title, subtitle: `${formatDateTime(a.startAt)} · ${a.department?.name ?? "Toàn trường"}`, badge: <ActivityStatusBadge status={activityStatus(a)} />, href: `/activities/${a.id}`,
      details: [["Thời gian", formatDateTime(a.startAt)], ["Tổ chức", a.department?.name ?? "Toàn trường"], ["Tham gia", a._count.attendances]],
    }))} />
    <div className="max-sm:hidden">
    <DataTable>
      <thead><tr><Th>Hoạt động</Th><Th>Thời gian</Th><Th>Tổ chức</Th><Th className="text-right">Tham gia</Th><Th>Trạng thái</Th></tr></thead>
      <tbody>{rows.map((a) => (
        <tr key={a.id}><Td><Link href={`/activities/${a.id}`} className="font-medium hover:text-primary">{a.title}</Link></Td><Td className="whitespace-nowrap">{formatDateTime(a.startAt)}</Td>
          <Td>{a.department?.name ?? "Toàn trường"}</Td><Td className="text-right tabular-nums">{a._count.attendances}</Td><Td><ActivityStatusBadge status={activityStatus(a)} /></Td></tr>
      ))}</tbody>
    </DataTable>
    </div>
    </>
  );
}

async function SecretaryDashboard({ departmentId, name }: { departmentId: string | null; name: string | null }) {
  if (!departmentId) {
    return <><PageHeader title="Tổng quan" /><EmptyState title="Bạn chưa được phân công Chi đoàn" description="Liên hệ quản trị viên để được phân công." /></>;
  }
  const now = new Date();
  const scope = { OR: [{ departmentId }, { departmentId: null }] };
  const [members, activityCount, rate, points, upcoming, quiet, recent, monthly] = await Promise.all([
    db.member.count({ where: { departmentId, status: "ACTIVE" } }),
    db.activity.count({ where: { departmentId, cancelledAt: null } }),
    participationRate(departmentId),
    db.member.aggregate({ where: { departmentId }, _sum: { totalPoints: true } }),
    db.activity.findMany({ where: { ...scope, cancelledAt: null, endAt: { gte: now } }, orderBy: { startAt: "asc" }, take: 5, include: { department: true, _count: { select: { attendances: true } } } }),
    // Đoàn viên chưa tham gia hoạt động nào
    db.member.findMany({ where: { departmentId, status: "ACTIVE", attendances: { none: {} } }, orderBy: { fullName: "asc" }, take: 8, include: { class: true } }),
    db.activity.findMany({ where: { ...scope, startAt: { lte: now } }, orderBy: { startAt: "desc" }, take: 5, include: { department: true, _count: { select: { attendances: { where: { member: { departmentId } } } } } } }),
    monthlyParticipation(departmentId),
  ]);
  return (
    <>
      <PageHeader title={`Chi đoàn ${name}`} />
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Đoàn viên" value={members} />
        <Stat label="Hoạt động" value={activityCount} />
        <Stat label="Tỷ lệ tham gia" value={`${rate}%`} />
        <Stat label="Tổng điểm" value={formatNumber(points._sum.totalPoints ?? 0)} />
      </div>
      <Section title="Tỷ lệ tham gia theo tháng" className="mt-8"><ParticipationChart data={monthly} /></Section>
      <Section title="Hoạt động sắp tới" actions={<Link href="/activities/new" className={buttonClass("primary", "sm")}>Tạo hoạt động</Link>}>
        {upcoming.length === 0 ? <EmptyState title="Không có hoạt động sắp tới" /> : <RecentTable rows={upcoming} />}
      </Section>
      <Section title="Đoàn viên chưa tham gia hoạt động nào">
        {quiet.length === 0 ? <p className="text-sm text-muted">Tất cả đoàn viên đã tham gia ít nhất một hoạt động.</p> : (
          <DataTable>
            <thead><tr><Th>Mã</Th><Th>Họ tên</Th><Th>Lớp</Th></tr></thead>
            <tbody>{quiet.map((m) => <tr key={m.id}><Td className="font-mono text-[13px]">{m.code}</Td><Td><Link href={`/members/${m.id}`} className="font-medium hover:text-primary">{m.fullName}</Link></Td><Td>{m.class.name}</Td></tr>)}</tbody>
          </DataTable>
        )}
      </Section>
      <Section title="Lịch sử hoạt động"><RecentTable rows={recent} /></Section>
    </>
  );
}

async function MemberDashboard({ user }: { user: Awaited<ReturnType<typeof requireUser>> }) {
  const now = new Date();
  const [member, attended, upcoming, badges, regs] = await Promise.all([
    db.member.findUniqueOrThrow({ where: { id: user.memberId! } }),
    db.attendance.count({ where: { memberId: user.memberId! } }),
    db.activity.findMany({ where: { AND: [activityScope(user), { cancelledAt: null, endAt: { gte: now } }] }, orderBy: { startAt: "asc" }, take: 5, include: { category: true } }),
    db.memberBadge.findMany({ where: { memberId: user.memberId! }, include: { badge: true }, orderBy: { awardedAt: "desc" }, take: 6 }),
    db.activityRegistration.findMany({ where: { memberId: user.memberId!, status: "REGISTERED" }, select: { activityId: true } }),
  ]);
  const registered = new Set(regs.map((r) => r.activityId));
  return (
    <>
      <PageHeader title={`Xin chào, ${user.fullName}`} description={`Chi đoàn ${user.departmentName}`}
        actions={<Link href="/checkin" className={buttonClass()}>Quét QR điểm danh</Link>} />
      <div className="grid grid-cols-3 gap-6 sm:max-w-xl">
        <Stat label="Điểm của tôi" value={member.totalPoints} />
        <Stat label="Hoạt động đã tham gia" value={attended} />
        <Stat label="Giờ tình nguyện" value={formatHours(member.volunteerMinutes)} />
      </div>
      <Section title="Hoạt động sắp tới" className="mt-8" actions={<Link href="/activities" className="text-[13px] text-primary hover:underline">Xem tất cả</Link>}>
        {upcoming.length === 0 ? <EmptyState title="Chưa có hoạt động sắp tới" /> : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white/85">
            {upcoming.map((a) => (
              <li key={a.id}>
                <Link href={`/activities/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0"><div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted">{formatDate(a.startAt)} · {formatTime(a.startAt)} · {a.location}</div></div>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    {registered.has(a.id) && <span className="text-primary">Đã đăng ký</span>}
                    {a.checkinOpen && <span className="rounded bg-primary-light px-2 py-0.5 font-medium text-primary-dark">Đang điểm danh</span>}
                    <span className="text-muted">+{a.points} điểm</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Thành tích gần đây" actions={<Link href="/achievements" className="text-[13px] text-primary hover:underline">Chi tiết</Link>}>
        {badges.length === 0 ? <p className="text-sm text-muted">Chưa có huy hiệu. Tham gia hoạt động để nhận thành tích.</p> : (
          <div className="flex flex-wrap gap-2">{badges.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-[13px] text-primary-dark"><BadgeIcon name={b.badge.icon} className="size-3.5" />{b.badge.name}</span>
          ))}</div>
        )}
      </Section>
    </>
  );
}
