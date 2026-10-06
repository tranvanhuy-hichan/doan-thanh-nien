import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/nav";
import { formatDateTime } from "@/utils";
import { DataTable, PageHeader, Td, Th } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/misc";
import { AvatarEditor } from "@/components/members/avatar-editor";
import { NameForm } from "@/components/members/name-form";
import { Bell, CalendarRange, Database, History, KeyRound, ListChecks, UserRound } from "lucide-react";
import { RETENTION, storageStats } from "@/lib/services/cleanup";
import { DataManager } from "@/components/settings/data-manager";
import { loadCalendars } from "@/lib/services/school-calendar";
import { SchoolYearManager } from "@/components/settings/school-year-manager";
import { NotificationControls } from "@/components/notifications/controls";
import { ChangePasswordForm } from "@/components/members/change-password-form";
import { CategoryFormButton, DeleteCategoryButton } from "@/components/members/category-manager";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const admin = user.role === "ADMIN";
  const tabs = [
    { key: "account", label: "Tài khoản", icon: <UserRound className="size-4" /> },
    { key: "notifications", label: "Thông báo", icon: <Bell className="size-4" /> },
    { key: "password", label: "Mật khẩu", icon: <KeyRound className="size-4" /> },
    ...(admin ? [{ key: "schoolyear", label: "Năm học", icon: <CalendarRange className="size-4" /> }, { key: "categories", label: "Loại hoạt động", icon: <ListChecks className="size-4" /> }, { key: "logs", label: "Nhật ký", icon: <History className="size-4" /> }, { key: "data", label: "Dữ liệu", icon: <Database className="size-4" /> }] : []),
  ];
  const requested = (await searchParams).tab;
  const tab = tabs.some((t) => t.key === requested) ? requested! : "account";

  // Chỉ nạp dữ liệu của tab đang mở.
  const categories = admin && tab === "categories" ? await db.activityCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { activities: true } } } }) : [];
  const customYears = admin && tab === "schoolyear" ? new Set((await db.schoolYear.findMany({ select: { startYear: true } })).map((r) => r.startYear)) : new Set<number>();
  const calendars = admin && tab === "schoolyear" ? await loadCalendars() : [];
  const storage = admin && tab === "data" ? await storageStats() : null;
  const logs = admin && tab === "logs" ? await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { fullName: true, username: true } } } }) : [];

  return (
    <>
      <PageHeader title="Cài đặt" />
      <Tabs tabs={tabs} active={tab} basePath="/settings" />

      {tab === "account" && (
        <>
        <div className="mb-5 flex items-center gap-4">
          <Avatar name={user.fullName} src={user.avatarUrl} size={72} />
          <div>
            <p className="mb-2 font-semibold">{user.fullName}</p>
            <AvatarEditor label="Đổi ảnh đại diện" />
          </div>
        </div>
        {admin && <NameForm initial={user.fullName} />}
        <dl className="grid max-w-md grid-cols-[130px_1fr] gap-y-2 text-sm">
          {!admin && <><dt className="text-muted">Họ tên</dt><dd>{user.fullName}</dd></>}
          <dt className="text-muted">Tên đăng nhập</dt><dd className="font-mono">{user.username}</dd>
          {user.memberCode && <><dt className="text-muted">Mã đoàn viên</dt><dd className="font-mono">{user.memberCode}</dd></>}
          <dt className="text-muted">Vai trò</dt><dd>{ROLE_LABEL[user.role]}</dd>
          {user.departmentName && <><dt className="text-muted">Chi đoàn</dt><dd>{user.departmentName}</dd></>}
        </dl>
        </>
      )}

      {tab === "notifications" && <div className="max-w-sm"><NotificationControls /></div>}

      {tab === "password" && <div className="max-w-sm"><ChangePasswordForm /></div>}

      {tab === "schoolyear" && <SchoolYearManager rows={calendars.map((c) => ({ ...c, custom: customYears.has(c.startYear) }))} />}

      {tab === "categories" && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Điểm mặc định khi tạo hoạt động theo từng loại.</p>
            <CategoryFormButton />
          </div>
          <DataTable>
            <thead><tr><Th>Loại</Th><Th className="text-right">Điểm mặc định</Th><Th className="text-right">Số hoạt động</Th><Th /></tr></thead>
            <tbody>{categories.map((c) => (
              <tr key={c.id}><Td className="font-medium">{c.name}</Td><Td className="text-right tabular-nums">{c.defaultPoints}</Td><Td className="text-right tabular-nums">{c._count.activities}</Td>
                <Td className="text-right whitespace-nowrap"><CategoryFormButton category={c} /><DeleteCategoryButton id={c.id} name={c.name} /></Td></tr>
            ))}</tbody>
          </DataTable>
        </>
      )}

      {tab === "data" && storage && <DataManager totalBytes={storage.totalBytes} tables={storage.tables} retention={RETENTION} />}

      {tab === "logs" && (
        <>
          <p className="mb-3 text-sm text-muted">30 thao tác gần nhất trong hệ thống.</p>
          <DataTable>
            <thead><tr><Th>Thời gian</Th><Th>Người thực hiện</Th><Th>Hành động</Th><Th>Đối tượng</Th></tr></thead>
            <tbody>{logs.map((l) => (
              <tr key={l.id}><Td className="whitespace-nowrap">{formatDateTime(l.createdAt)}</Td><Td>{l.user?.fullName ?? "—"}</Td><Td className="font-mono text-[13px]">{l.action}</Td>
                <Td className="text-muted">{l.target}{l.targetId ? ` · ${l.targetId.slice(0, 8)}` : ""}</Td></tr>
            ))}</tbody>
          </DataTable>
        </>
      )}
    </>
  );
}
