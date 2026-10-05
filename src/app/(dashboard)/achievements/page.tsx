import { CompactList } from "@/components/ui/compact-list";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { memberScope } from "@/lib/services/queries";
import { formatDate, formatHours } from "@/utils";
import { Avatar, DataTable, EmptyState, PageHeader, Section, Stat, Td, Th } from "@/components/ui/misc";
import { TopMembersList } from "@/components/members/top-members-list";
import { BadgeIcon } from "@/components/members/badge-icon";
import { BadgeFormButton, CRITERIA_LABEL, DeleteBadgeButton } from "@/components/members/badge-manager";

export const metadata = { title: "Thành tích" };

export default async function AchievementsPage() {
  const user = await requireUser();
  const [badges, categories] = await Promise.all([
    db.badge.findMany({ orderBy: [{ criteria: "asc" }, { threshold: "asc" }], include: { category: true, _count: { select: { members: true } } } }),
    db.activityCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (user.role === "MEMBER") {
    const member = await db.member.findUniqueOrThrow({
      where: { id: user.memberId! },
      include: { badges: true, attendances: { select: { activity: { select: { categoryId: true } } } } },
    });
    const owned = new Map(member.badges.map((b) => [b.badgeId, b.awardedAt]));
    const progress = (b: (typeof badges)[number]) => {
      switch (b.criteria) {
        case "ACTIVITY_COUNT": return member.attendances.length;
        case "VOLUNTEER_HOURS": return Math.floor(member.volunteerMinutes / 60);
        case "TOTAL_POINTS": return member.totalPoints;
        default: return member.attendances.filter((a) => a.activity.categoryId === b.categoryId).length;
      }
    };
    return (
      <>
        <PageHeader title="Thành tích" />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Huy hiệu đã đạt" value={`${owned.size}/${badges.length}`} />
          <Stat label="Hoạt động" value={member.attendances.length} />
          <Stat label="Giờ tình nguyện" value={formatHours(member.volunteerMinutes)} />
          <Stat label="Điểm hoạt động" value={member.totalPoints} />
        </div>
        <Section title="Huy hiệu" className="mt-8">
          {badges.length === 0 ? <EmptyState title="Chưa có huy hiệu nào được thiết lập" /> : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-white/85">
              {badges.map((b) => {
                const got = owned.get(b.id);
                const value = Math.min(progress(b), b.threshold);
                return (
                  <li key={b.id} className="flex items-center gap-4 px-4 py-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${got ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}><BadgeIcon name={b.icon} className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted">{b.description}</div>
                      {!got && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-primary" style={{ width: `${(value / b.threshold) * 100}%` }} /></div>
                          <span className="text-xs text-muted tabular-nums">{value}/{b.threshold}</span>
                        </div>
                      )}
                    </div>
                    {got && <span className="text-xs text-primary-dark">Đạt ngày {formatDate(got)}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </>
    );
  }

  // Admin / Bí thư: bảng xếp hạng (bí thư chỉ trong Chi đoàn của mình)
  const top = await db.member.findMany({
    where: memberScope(user), orderBy: [{ totalPoints: "desc" }, { fullName: "asc" }], take: 10,
    include: { class: true, department: true, _count: { select: { badges: true, attendances: true } } },
  });
  const isAdmin = user.role === "ADMIN";
  return (
    <>
      <PageHeader title="Thành tích" description={isAdmin ? "Quản lý huy hiệu và đoàn viên tiêu biểu" : `Đoàn viên tiêu biểu Chi đoàn ${user.departmentName}`} actions={isAdmin && <BadgeFormButton categories={categories} />} />
      <Section title="Huy hiệu">
        {badges.length === 0 ? <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có huy hiệu" description="Tạo huy hiệu để ghi nhận thành tích của đoàn viên." /></div> : (
          <>
          <CompactList items={badges.map((b) => ({ id: b.id, title: b.name, subtitle: b.description, leading: <BadgeIcon name={b.icon} className="size-5 text-primary" />, value: b._count.members,
            details: [["Điều kiện", `${CRITERIA_LABEL[b.criteria]}${b.category ? ` (${b.category.name})` : ""} ≥ ${b.threshold}`], ["Đã đạt", b._count.members]],
            actions: isAdmin ? <span className="flex"><BadgeFormButton badge={b} categories={categories} /><DeleteBadgeButton id={b.id} name={b.name} /></span> : undefined }))} />
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>Huy hiệu</Th><Th>Điều kiện</Th><Th className="text-right">Đã đạt</Th>{isAdmin && <Th />}</tr></thead>
            <tbody>{badges.map((b) => (
              <tr key={b.id}>
                <Td><span className="flex items-center gap-2 font-medium"><BadgeIcon name={b.icon} className="size-4 text-primary" />{b.name}</span><span className="text-xs text-muted">{b.description}</span></Td>
                <Td>{CRITERIA_LABEL[b.criteria]}{b.category ? ` (${b.category.name})` : ""} ≥ {b.threshold}</Td>
                <Td className="text-right tabular-nums">{b._count.members}</Td>
                {isAdmin && <Td className="text-right whitespace-nowrap"><BadgeFormButton badge={b} categories={categories} /><DeleteBadgeButton id={b.id} name={b.name} /></Td>}
              </tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
      </Section>
      <Section title="Đoàn viên tiêu biểu">
        {top.length === 0 ? <EmptyState title="Chưa có dữ liệu" /> : (
          <>
          <TopMembersList items={top.map((m, i) => ({ id: m.id, rank: i + 1, name: m.fullName, avatarUrl: m.avatarUrl, department: m.department.name, attendances: m._count.attendances, badges: m._count.badges, points: m.totalPoints }))} />
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>#</Th><Th>Đoàn viên</Th><Th>Chi đoàn</Th><Th className="text-right">Hoạt động</Th><Th className="text-right">Huy hiệu</Th><Th className="text-right">Điểm</Th></tr></thead>
            <tbody>{top.map((m, i) => (
              <tr key={m.id}><Td>{i + 1}</Td><Td><span className="flex items-center gap-2 font-medium"><Avatar name={m.fullName} src={m.avatarUrl} size={24} />{m.fullName}</span></Td>
                <Td>{m.department.name}</Td><Td className="text-right tabular-nums">{m._count.attendances}</Td><Td className="text-right tabular-nums">{m._count.badges}</Td><Td className="text-right font-medium tabular-nums">{m.totalPoints}</Td></tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
      </Section>
    </>
  );
}
