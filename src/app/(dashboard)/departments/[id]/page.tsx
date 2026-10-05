import Link from "next/link";
import { CompactList } from "@/components/ui/compact-list";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { participationRate } from "@/lib/services/queries";
import { formatDateShort, pageParam } from "@/utils";
import { DeleteDepartmentButton, DepartmentFormButton, SecretaryButton } from "@/components/members/department-actions";
import { Avatar, DataTable, EmptyState, PageHeader, Pagination, Section, Stat, Td, Th } from "@/components/ui/misc";

export const metadata = { title: "Chi đoàn" };

const PAGE_SIZE = 10;

export default async function DepartmentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const user = await requireRole(["ADMIN"]);
  const { id } = await params;
  const page = pageParam((await searchParams).page);
  if (!canManageDepartment(user, id)) notFound(); // bí thư Chi đoàn A mở URL Chi đoàn B -> 404
  const dept = await db.department.findUnique({
    where: { id },
    include: { secretary: { select: { id: true, fullName: true, username: true } }, _count: { select: { members: true, activities: true } } },
  });
  if (!dept) notFound();
  const [rate, points, members, activities, freeSecretaries] = await Promise.all([
    participationRate(id),
    db.member.aggregate({ where: { departmentId: id }, _sum: { totalPoints: true } }),
    db.member.findMany({ where: { departmentId: id }, orderBy: [{ totalPoints: "desc" }, { fullName: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { class: true } }),
    db.activity.findMany({ where: { departmentId: id }, orderBy: { startAt: "desc" }, take: 5, include: { _count: { select: { attendances: true } } } }),
    db.user.findMany({ where: { role: "SECRETARY", secretaryOf: null }, select: { id: true, fullName: true, username: true }, orderBy: { fullName: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title={`Chi đoàn ${dept.name}`} description={`Bí thư: ${dept.secretary?.fullName ?? "chưa phân công"}`}
        actions={<>
          <SecretaryButton departmentId={dept.id} current={dept.secretary} available={freeSecretaries} />
          <DepartmentFormButton dept={{ id: dept.id, name: dept.name, description: dept.description }} />
          <DeleteDepartmentButton id={dept.id} name={dept.name} />
        </>} />
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat label="Đoàn viên" value={dept._count.members} />
        <Stat label="Hoạt động" value={dept._count.activities} />
        <Stat label="Tỷ lệ tham gia" value={`${rate}%`} />
        <Stat label="Tổng điểm" value={(points._sum.totalPoints ?? 0).toLocaleString("vi-VN")} />
      </div>
      <Section title="Hoạt động gần đây" className="mt-8">
        {activities.length === 0 ? <EmptyState title="Chưa có hoạt động" /> : (
          <>
          <CompactList items={activities.map((a) => ({ id: a.id, title: a.title, subtitle: formatDateShort(a.startAt), value: a._count.attendances, href: `/activities/${a.id}`,
            details: [["Ngày", formatDateShort(a.startAt)], ["Tham gia", a._count.attendances]] }))} />
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>Hoạt động</Th><Th>Ngày</Th><Th className="text-right">Tham gia</Th></tr></thead>
            <tbody>{activities.map((a) => (
              <tr key={a.id}><Td><Link href={`/activities/${a.id}`} className="font-medium hover:text-primary">{a.title}</Link></Td><Td>{formatDateShort(a.startAt)}</Td><Td className="text-right">{a._count.attendances}</Td></tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
      </Section>
      <Section title={`Đoàn viên (${dept._count.members})`}>
        {members.length === 0 ? <EmptyState title="Chi đoàn chưa có đoàn viên" /> : (
          <>
          <CompactList items={members.map((m) => ({ id: m.id, title: m.fullName, subtitle: `${m.code} · ${m.class.name}`, leading: <Avatar name={m.fullName} src={m.avatarUrl} size={28} />, value: m.totalPoints,
            href: `/members/${m.id}`, hrefLabel: "Xem hồ sơ", details: [["Mã đoàn viên", m.code], ["Lớp", m.class.name], ["Điểm", m.totalPoints]] }))} />
          <div className="max-sm:hidden">
          <DataTable>
            <thead><tr><Th>Mã</Th><Th>Họ tên</Th><Th>Lớp</Th><Th className="text-right">Điểm</Th></tr></thead>
            <tbody>{members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <Td className="font-mono text-[13px]">{m.code}</Td>
                <Td><Link href={`/members/${m.id}`} className="flex items-center gap-2 font-medium hover:text-primary"><Avatar name={m.fullName} src={m.avatarUrl} size={24} />{m.fullName}</Link></Td>
                <Td>{m.class.name}</Td><Td className="text-right tabular-nums">{m.totalPoints}</Td>
              </tr>
            ))}</tbody>
          </DataTable>
          </div>
          </>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={dept._count.members} basePath={`/departments/${id}`} params={{}} />
      </Section>
    </>
  );
}
