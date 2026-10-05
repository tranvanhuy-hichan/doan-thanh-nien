import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/nav";
import { formatDateTime } from "@/utils";
import { DataTable, PageHeader, Section, Td, Th } from "@/components/ui/misc";
import { NotificationControls } from "@/components/notifications/controls";
import { ChangePasswordForm } from "@/components/members/change-password-form";
import { CategoryFormButton, DeleteCategoryButton } from "@/components/members/category-manager";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const [categories, logs] = admin ? await Promise.all([
    db.activityCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { activities: true } } } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { fullName: true, username: true } } } }),
  ]) : [[], []];
  return (
    <>
      <PageHeader title="Cài đặt" />
      <Section title="Tài khoản">
        <dl className="grid max-w-md grid-cols-[130px_1fr] gap-y-1.5 text-sm">
          <dt className="text-muted">Họ tên</dt><dd>{user.fullName}</dd>
          <dt className="text-muted">Tên đăng nhập</dt><dd className="font-mono">{user.username}</dd>
          <dt className="text-muted">Vai trò</dt><dd>{ROLE_LABEL[user.role]}</dd>
          {user.departmentName && <><dt className="text-muted">Chi đoàn</dt><dd>{user.departmentName}</dd></>}
        </dl>
      </Section>
      <Section title="Thông báo"><div className="max-w-sm"><NotificationControls /></div></Section>
      <Section title="Đổi mật khẩu"><div className="max-w-sm"><ChangePasswordForm /></div></Section>
      {admin && (
        <>
          <Section title="Loại hoạt động & điểm mặc định" actions={<CategoryFormButton />}>
            <DataTable>
              <thead><tr><Th>Loại</Th><Th className="text-right">Điểm mặc định</Th><Th className="text-right">Số hoạt động</Th><Th /></tr></thead>
              <tbody>{categories.map((c) => (
                <tr key={c.id}><Td className="font-medium">{c.name}</Td><Td className="text-right tabular-nums">{c.defaultPoints}</Td><Td className="text-right tabular-nums">{c._count.activities}</Td>
                  <Td className="text-right whitespace-nowrap"><CategoryFormButton category={c} /><DeleteCategoryButton id={c.id} name={c.name} /></Td></tr>
              ))}</tbody>
            </DataTable>
          </Section>
          <Section title="Nhật ký hệ thống (30 thao tác gần nhất)">
            <DataTable>
              <thead><tr><Th>Thời gian</Th><Th>Người thực hiện</Th><Th>Hành động</Th><Th>Đối tượng</Th></tr></thead>
              <tbody>{logs.map((l) => (
                <tr key={l.id}><Td className="whitespace-nowrap">{formatDateTime(l.createdAt)}</Td><Td>{l.user?.fullName ?? "—"}</Td><Td className="font-mono text-[13px]">{l.action}</Td>
                  <Td className="text-muted">{l.target}{l.targetId ? ` · ${l.targetId.slice(0, 8)}` : ""}</Td></tr>
              ))}</tbody>
            </DataTable>
          </Section>
        </>
      )}
    </>
  );
}
