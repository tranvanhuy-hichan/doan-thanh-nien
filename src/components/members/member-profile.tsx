import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatHours } from "@/utils";
import { CompactList } from "@/components/ui/compact-list";
import { Avatar, DataTable, EmptyState, Section, Stat, Td, Th } from "@/components/ui/misc";
import { MemberStatusBadge } from "./member-status";
import { BadgeIcon } from "@/components/members/badge-icon";

type M = NonNullable<Awaited<ReturnType<typeof import("@/lib/services/queries").getMemberForUser>>>;

export async function MemberProfile({ member, showAudit }: { member: M; showAudit?: boolean }) {
  const [attended, badges, points] = await Promise.all([
    db.attendance.count({ where: { memberId: member.id } }),
    db.memberBadge.findMany({ where: { memberId: member.id }, include: { badge: true }, orderBy: { awardedAt: "desc" } }),
    db.pointTransaction.findMany({ where: { memberId: member.id }, orderBy: { createdAt: "desc" }, take: 8, include: { createdBy: { select: { fullName: true } } } }),
  ]);
  const info: [string, React.ReactNode][] = [
    ["Mã đoàn viên", <span key="c" className="font-mono">{member.code}</span>],
    ["Chi đoàn", member.department.name],
    ["Lớp", member.class.name],
    ["Khóa", member.cohort ?? "—"],
    ["Ngày sinh", formatDate(member.dateOfBirth)],
    ["Giới tính", member.gender ?? "—"],
    ["Ngày vào Đoàn", formatDate(member.joinedAt)],
    ["Trạng thái", <MemberStatusBadge key="s" status={member.status} locked={member.user.status === "LOCKED"} />],
  ];
  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar name={member.fullName} src={member.avatarUrl} size={64} />
        <div>
          <h2 className="text-lg font-semibold">{member.fullName}</h2>
          <p className="text-sm text-muted">Mã đoàn viên: <span className="font-mono">{member.code}</span></p>
        </div>
      </div>
      <Section className="mt-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
          {info.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5">{v}</dd></div>)}
        </dl>
      </Section>
      <Section>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Hoạt động tham gia" value={attended} />
          <Stat label="Điểm hoạt động" value={member.totalPoints} />
          <Stat label="Giờ tình nguyện" value={formatHours(member.volunteerMinutes)} />
          <Stat label="Thành tích" value={badges.length} />
        </div>
      </Section>
      {badges.length > 0 && (
        <Section title="Thành tích">
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-[13px] text-primary-dark" title={b.badge.description}>
                <BadgeIcon name={b.badge.icon} className="size-3.5" />{b.badge.name}
              </span>
            ))}
          </div>
        </Section>
      )}
      <Section title="Lịch sử điểm gần đây">
        {points.length === 0 ? <EmptyState title="Chưa có giao dịch điểm" /> : (
          <>
          <CompactList items={points.map((p) => ({
            id: p.id, title: p.reason, subtitle: formatDateTime(p.createdAt),
            value: <span className={p.points < 0 ? "text-danger" : "text-primary"}>{p.points > 0 ? "+" : ""}{p.points}</span>,
            details: [["Thời gian", formatDateTime(p.createdAt)], ["Nội dung", p.reason], ["Điểm", `${p.points > 0 ? "+" : ""}${p.points}`],
              ...(showAudit && p.createdBy ? [["Người thực hiện", p.createdBy.fullName] as [string, string]] : [])],
          }))} />
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>Thời gian</Th><Th>Nội dung</Th><Th className="text-right">Điểm</Th>{showAudit && <Th>Người thực hiện</Th>}</tr></thead>
            <tbody>{points.map((p) => (
              <tr key={p.id}>
                <Td className="whitespace-nowrap">{formatDateTime(p.createdAt)}</Td><Td>{p.reason}</Td>
                <Td className={`text-right font-medium tabular-nums ${p.points < 0 ? "text-danger" : "text-primary"}`}>{p.points > 0 ? "+" : ""}{p.points}</Td>
                {showAudit && <Td>{p.createdBy?.fullName ?? "—"}</Td>}
              </tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
      </Section>
    </>
  );
}
