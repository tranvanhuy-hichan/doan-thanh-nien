import Link from "next/link";
import { CompactList } from "@/components/ui/compact-list";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { departmentRanking } from "@/lib/services/stats";
import { pageParam } from "@/utils";
import { DataTable, EmptyState, PageHeader, Pagination, Td, Th } from "@/components/ui/misc";
import { cohortLabel } from "@/lib/school-year";
import { DeleteDepartmentButton, DepartmentFormButton, SecretaryButton, SyncSchoolYearButton } from "@/components/members/department-actions";

export const metadata = { title: "Chi đoàn" };

const PAGE_SIZE = 10;

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ page?: string; ra_truong?: string }> }) {
  const user = await requireRole(["ADMIN"]);
  const isAdmin = user.role === "ADMIN";
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const graduated = sp.ra_truong === "1";
  const where = isAdmin ? { graduatedAt: graduated ? { not: null } : null } : { id: user.departmentId ?? "__none__" };
  const [totalDepts, departments, ranking, memberRows] = await Promise.all([
    db.department.count({ where }),
    db.department.findMany({
      where, orderBy: { name: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { secretary: { select: { id: true, fullName: true, username: true } }, _count: { select: { members: true, activities: true } } },
    }),
    departmentRanking(),
    isAdmin
      ? db.member.findMany({ where: { status: "ACTIVE", department: { graduatedAt: null } }, orderBy: { fullName: "asc" }, select: { id: true, userId: true, fullName: true, code: true, departmentId: true } })
      : Promise.resolve([]),
  ]);

  const rates = departments.map((d) => ranking.find((r) => r.id === d.id)?.rate ?? 0);

  return (
    <>
      <PageHeader title={isAdmin ? "Chi đoàn" : "Chi đoàn của tôi"} description={isAdmin ? `${totalDepts} Chi đoàn ${graduated ? "đã ra trường" : "đang học"}` : undefined}
        actions={isAdmin && <><SyncSchoolYearButton /><DepartmentFormButton /></>} />
      {isAdmin && (
        <div className="mb-4 flex gap-1 text-sm">
          <Link href="/departments" className={`rounded-md px-3 py-1.5 ${!graduated ? "bg-primary text-white" : "bg-white/85 hover:bg-slate-100"}`}>Đang học</Link>
          <Link href="/departments?ra_truong=1" className={`rounded-md px-3 py-1.5 ${graduated ? "bg-primary text-white" : "bg-white/85 hover:bg-slate-100"}`}>Đã ra trường</Link>
        </div>
      )}
      {departments.length === 0 ? (
        <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có Chi đoàn nào" description="Tạo Chi đoàn đầu tiên để bắt đầu thêm đoàn viên." /></div>
      ) : (
        <>
        <CompactList items={departments.map((d, i) => ({
          id: d.id, title: `Chi đoàn ${d.name}${d.startYear ? ` (${cohortLabel(d.startYear)})` : ""}`, subtitle: d.secretary ? `Bí thư: ${d.secretary.fullName}` : graduated ? "Đã ra trường" : "Chưa phân công bí thư", value: `${rates[i]}%`,
          href: `/departments/${d.id}`,
        }))} />
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Chi đoàn</Th><Th>Niên khóa</Th><Th>Bí thư</Th><Th className="text-right">Đoàn viên</Th><Th className="text-right">Hoạt động</Th><Th className="text-right">Tỷ lệ tham gia</Th>{isAdmin && <Th />}</tr></thead>
          <tbody>
            {departments.map((d, i) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <Td><Link href={`/departments/${d.id}`} className="font-medium text-primary hover:underline">{d.name}</Link></Td>
                <Td className="whitespace-nowrap">{cohortLabel(d.startYear) || "—"}</Td>
                <Td>{d.secretary ? d.secretary.fullName : <span className="text-muted">Chưa phân công</span>}</Td>
                <Td className="text-right tabular-nums">{d._count.members}</Td>
                <Td className="text-right tabular-nums">{d._count.activities}</Td>
                <Td className="text-right tabular-nums">{rates[i]}%</Td>
                {isAdmin && (
                  <Td className="text-right whitespace-nowrap">
                    <SecretaryButton departmentId={d.id} current={d.secretary} candidates={memberRows.filter((m) => m.departmentId === d.id).map((m) => ({ id: m.id, userId: m.userId, label: `${m.fullName} (${m.code})` }))} />
                    <DepartmentFormButton dept={{ id: d.id, name: d.name, description: d.description, startYear: d.startYear }} />
                    <DeleteDepartmentButton id={d.id} name={d.name} />
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </DataTable>
        </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={totalDepts} basePath="/departments" params={{}} />
    </>
  );
}
