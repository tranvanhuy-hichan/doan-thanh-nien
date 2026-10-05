import Link from "next/link";
import { CompactList } from "@/components/ui/compact-list";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { participationRate } from "@/lib/services/queries";
import { pageParam } from "@/utils";
import { DataTable, EmptyState, PageHeader, Pagination, Td, Th } from "@/components/ui/misc";
import { DeleteDepartmentButton, DepartmentFormButton, SecretaryButton } from "@/components/members/department-actions";

export const metadata = { title: "Chi đoàn" };

const PAGE_SIZE = 10;

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const isAdmin = user.role === "ADMIN";
  const page = pageParam((await searchParams).page);
  const where = isAdmin ? {} : { id: user.departmentId ?? "__none__" };
  const totalDepts = await db.department.count({ where });
  const departments = await db.department.findMany({
    where, orderBy: { name: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
    include: { secretary: { select: { id: true, fullName: true, username: true } }, _count: { select: { members: true, activities: true } } },
  });
  const [rates, freeSecretaries] = await Promise.all([
    Promise.all(departments.map((d) => participationRate(d.id))),
    isAdmin
      ? db.user.findMany({ where: { role: "SECRETARY", secretaryOf: null }, select: { id: true, fullName: true, username: true }, orderBy: { fullName: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader title={isAdmin ? "Chi đoàn" : "Chi đoàn của tôi"} description={isAdmin ? `${totalDepts} Chi đoàn` : undefined}
        actions={isAdmin && <DepartmentFormButton />} />
      {departments.length === 0 ? (
        <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Chưa có Chi đoàn nào" description="Tạo Chi đoàn đầu tiên để bắt đầu thêm đoàn viên." /></div>
      ) : (
        <>
        <CompactList items={departments.map((d, i) => ({
          id: d.id, title: `Chi đoàn ${d.name}`, subtitle: d.secretary ? `Bí thư: ${d.secretary.fullName}` : "Chưa phân công bí thư", value: `${rates[i]}%`,
          href: `/departments/${d.id}`, hrefLabel: "Xem Chi đoàn",
          details: [["Bí thư", d.secretary?.fullName ?? "Chưa phân công"], ["Đoàn viên", d._count.members], ["Hoạt động", d._count.activities], ["Tỷ lệ tham gia", `${rates[i]}%`]],
          actions: isAdmin ? (
            <span className="flex items-center gap-1">
              <SecretaryButton departmentId={d.id} current={d.secretary} available={freeSecretaries} />
              <DepartmentFormButton dept={{ id: d.id, name: d.name, description: d.description }} />
              <DeleteDepartmentButton id={d.id} name={d.name} />
            </span>
          ) : undefined,
        }))} />
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Chi đoàn</Th><Th>Bí thư</Th><Th className="text-right">Đoàn viên</Th><Th className="text-right">Hoạt động</Th><Th className="text-right">Tỷ lệ tham gia</Th>{isAdmin && <Th />}</tr></thead>
          <tbody>
            {departments.map((d, i) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <Td><Link href={`/departments/${d.id}`} className="font-medium text-primary hover:underline">{d.name}</Link></Td>
                <Td>{d.secretary ? d.secretary.fullName : <span className="text-muted">Chưa phân công</span>}</Td>
                <Td className="text-right tabular-nums">{d._count.members}</Td>
                <Td className="text-right tabular-nums">{d._count.activities}</Td>
                <Td className="text-right tabular-nums">{rates[i]}%</Td>
                {isAdmin && (
                  <Td className="text-right whitespace-nowrap">
                    <SecretaryButton departmentId={d.id} current={d.secretary} available={freeSecretaries} />
                    <DepartmentFormButton dept={{ id: d.id, name: d.name, description: d.description }} />
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
