import Link from "next/link";
import { ClickRow } from "@/components/ui/click-row";
import { CompactList } from "@/components/ui/compact-list";
import { Plus, Upload } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { memberScope } from "@/lib/services/queries";
import { formatDate, pageParam, str } from "@/utils";
import { buttonClass } from "@/components/ui/button";
import { Avatar, DataTable, EmptyState, PageHeader, Pagination, Td, Th } from "@/components/ui/misc";
import { FilterBar } from "@/components/ui/filter-bar";
import { MemberStatusBadge } from "@/components/members/member-status";
import { ImportMembersButton } from "@/components/members/import-members";

export const metadata = { title: "Đoàn viên" };
const PAGE_SIZE = 15;

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole(["ADMIN", "SECRETARY"]);
  const sp = await searchParams;
  const q = str(sp.q), dept = str(sp.dept), cohort = str(sp.cohort), status = str(sp.status);
  const page = pageParam(sp.page);

  const where: Prisma.MemberWhereInput = {
    AND: [
      memberScope(user),
      q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] } : {},
      dept && user.role === "ADMIN" ? { departmentId: dept } : {},
      cohort ? { cohort: Number(cohort) || -1 } : {},
      status === "LOCKED" ? { user: { status: "LOCKED" } } : status ? { status: status as "ACTIVE" } : {},
    ],
  };
  const [members, total, departments, cohorts] = await Promise.all([
    db.member.findMany({
      where, orderBy: [{ department: { name: "asc" } }, { fullName: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { class: true, department: true, user: { select: { status: true } } },
    }),
    db.member.count({ where }),
    user.role === "ADMIN" ? db.department.findMany({ where: { graduatedAt: null }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    db.member.findMany({ where: memberScope(user), distinct: ["cohort"], select: { cohort: true }, orderBy: { cohort: "desc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Đoàn viên"
        description={user.role === "SECRETARY" ? `Đoàn viên Chi đoàn ${user.departmentName}` : "Danh sách đoàn viên toàn trường"}
        actions={user.role === "ADMIN" && (
          <>
            <ImportMembersButton />
            <Link href="/members/new" className={buttonClass()}><Plus className="size-4" />Thêm<span className="max-sm:hidden"> đoàn viên</span></Link>
          </>
        )}
      />
      <FilterBar fields={[
        { type: "search", name: "q", placeholder: "Tìm theo tên hoặc mã đoàn viên..." },
        ...(user.role === "ADMIN" ? [{ type: "select" as const, name: "dept", label: "Chi đoàn", options: departments.map((d) => ({ value: d.id, label: d.name })) }] : []),
        { type: "select", name: "cohort", label: "Khóa", options: cohorts.filter((c) => c.cohort).map((c) => ({ value: String(c.cohort), label: `Khóa ${c.cohort}` })) },
        { type: "select", name: "status", label: "Trạng thái", options: [
          { value: "ACTIVE", label: "Đang sinh hoạt" }, { value: "TRANSFERRED", label: "Đã chuyển sinh hoạt" },
          { value: "GRADUATED", label: "Đã ra trường" }, { value: "LOCKED", label: "Tài khoản bị khóa" }] },
      ]} />
      {members.length === 0 ? (
        <div className="rounded-lg border border-border bg-white/85"><EmptyState title="Không có đoàn viên nào" description="Thử đổi bộ lọc, hoặc thêm đoàn viên mới." /></div>
      ) : (
        <>
        <CompactList items={members.map((m) => ({
          id: m.id, title: m.fullName, subtitle: `${m.code} · ${m.class.name}`, leading: <Avatar name={m.fullName} src={m.avatarUrl} size={28} />,
          badge: <MemberStatusBadge status={m.status} locked={m.user.status === "LOCKED"} />, href: `/members/${m.id}`, hrefLabel: "Xem hồ sơ",
          details: [["Mã đoàn viên", m.code], ["Lớp", m.class.name], ["Chi đoàn", m.department.name], ["Ngày sinh", formatDate(m.dateOfBirth)]],
        }))} />
        <div className="max-sm:hidden">
        <DataTable>
          <thead><tr><Th>Mã đoàn viên</Th><Th>Họ tên</Th><Th>Lớp</Th><Th>Chi đoàn</Th><Th>Ngày sinh</Th><Th>Trạng thái</Th></tr></thead>
          <tbody>
            {members.map((m) => (
              <ClickRow key={m.id} href={`/members/${m.id}`}>
                <Td className="font-mono text-[13px]">{m.code}</Td>
                <Td>
                  <Link href={`/members/${m.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    <Avatar name={m.fullName} src={m.avatarUrl} size={28} />{m.fullName}
                  </Link>
                </Td>
                <Td>{m.class.name}</Td>
                <Td>{m.department.name}</Td>
                <Td>{formatDate(m.dateOfBirth)}</Td>
                <Td><MemberStatusBadge status={m.status} locked={m.user.status === "LOCKED"} /></Td>
              </ClickRow>
            ))}
          </tbody>
        </DataTable>
        </div>
        </>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/members" params={{ q, dept, cohort, status }} />
    </>
  );
}
