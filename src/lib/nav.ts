import { FileText, Globe, Settings, Award, BarChart3, CalendarDays, CheckSquare, IdCard, LayoutDashboard, Newspaper, QrCode, Trophy, School, History, Users, Vote, MessageSquare, Inbox, ClipboardList, Bell, BookOpen, Megaphone, type LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Tiền tố đường dẫn coi là đang ở mục này (mặc định = href). */ match?: string; /** Menu con (hiển thị dạng nhóm mở/đóng). */ children?: { href: string; label: string; icon?: LucideIcon }[]; /** Nhóm mở sẵn (mặc định: chỉ mở khi đang ở một mục bên trong). */ open?: boolean };

export function navFor(role: Role): NavItem[] {
  if (role === "MEMBER") {
    return [
      { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/feed", label: "Bảng tin", icon: Newspaper },
      { href: "/profile", label: "Hồ sơ & thẻ số", icon: IdCard },
      { href: "/activities", label: "Hoạt động", icon: CalendarDays },
      { href: "/emulation", label: "Thi đua", icon: Trophy },
      { href: "/checkin", label: "Quét QR", icon: QrCode },
      { href: "/history", label: "Lịch sử", icon: History },
      { href: "/achievements", label: "Thành tích", icon: Award },
      { href: "/polls", label: "Bình chọn", icon: Vote },
    ];
  }
  if (role === "SECRETARY") {
    // Bí thư: chỉ phạm vi Chi đoàn của mình -> không có quản lý Chi đoàn / Báo cáo toàn trường.
    return [
      { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/feed", label: "Bảng tin", icon: Newspaper },
      { href: "/members", label: "Đoàn viên", icon: Users },
      { href: "/activities", label: "Hoạt động", icon: CalendarDays },
      { href: "/attendance", label: "Điểm danh", icon: CheckSquare },
      { href: "/emulation", label: "Thi đua", icon: Trophy },
      { href: "/achievements", label: "Thành tích", icon: Award },
      { href: "/polls", label: "Bình chọn", icon: Vote },
      { href: "/chapter-reports", label: "Báo cáo Chi đoàn", icon: FileText },
      // Bí thư cũng là đoàn viên: có hồ sơ, quét QR, lịch sử như đoàn viên
      { href: "/profile", label: "Hồ sơ & thẻ số", icon: IdCard },
      { href: "/checkin", label: "Quét QR", icon: QrCode },
      { href: "/history", label: "Lịch sử", icon: History },
      {
        href: "/cms/tin-tuc", label: "Cổng thông tin", icon: Globe, match: "/cms",
        children: [{ href: "/cms/tin-tuc", label: "Tin tức", icon: Newspaper }, { href: "/cms/ke-hoach", label: "Kế hoạch", icon: ClipboardList }, { href: "/cms/su-kien", label: "Sự kiện", icon: CalendarDays }, { href: "/cms/thong-bao", label: "Thông báo", icon: Bell }],
      },
    ];
  }
  // Admin: gom nhóm cho gọn (nhóm tự mở khi đang ở một mục bên trong; "Cổng thông tin" luôn mở sẵn)
  return [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/approvals", label: "Hàng chờ duyệt", icon: Inbox },
    { href: "/members", label: "Tổ chức", icon: Users, children: [{ href: "/members", label: "Đoàn viên", icon: Users }, { href: "/departments", label: "Chi đoàn", icon: School }] },
    {
      href: "/activities", label: "Hoạt động", icon: CalendarDays,
      children: [{ href: "/activities", label: "Hoạt động", icon: CalendarDays }, { href: "/attendance", label: "Điểm danh", icon: CheckSquare }, { href: "/schedule", label: "Lịch công tác", icon: ClipboardList }],
    },
    { href: "/emulation", label: "Phong trào", icon: Trophy, children: [{ href: "/emulation", label: "Thi đua", icon: Trophy }, { href: "/achievements", label: "Thành tích", icon: Award }] },
    { href: "/feed", label: "Cộng đồng", icon: Newspaper, children: [{ href: "/feed", label: "Bảng tin", icon: Newspaper }, { href: "/polls", label: "Bình chọn", icon: Vote }, { href: "/feedback", label: "Góp ý", icon: MessageSquare }] },
    { href: "/reports", label: "Báo cáo", icon: BarChart3 },
    {
      href: "/cms/tin-tuc", label: "Cổng thông tin", icon: Globe, match: "/cms", open: true,
      children: [
        { href: "/cms/tin-tuc", label: "Tin tức", icon: Newspaper }, { href: "/cms/ke-hoach", label: "Kế hoạch", icon: ClipboardList }, { href: "/cms/su-kien", label: "Sự kiện", icon: CalendarDays },
        { href: "/cms/thong-bao", label: "Thông báo", icon: Bell }, { href: "/cms/pages", label: "Trang giới thiệu", icon: BookOpen },
        { href: "/chapter-reports", label: "Báo cáo Chi đoàn", icon: FileText }, { href: "/cms/marquee", label: "Dòng chữ chạy", icon: Megaphone }, { href: "/cms/settings", label: "Thông tin website", icon: Settings },
      ],
    },
  ];
}

/** Thanh điều hướng dưới (mobile): 4 mục dùng nhiều nhất theo vai trò, phần còn lại nằm trong nút "Thêm". */
const PRIMARY_MOBILE: Record<Role, string[]> = {
  ADMIN: ["/dashboard", "/departments", "/activities", "/feed"],
  SECRETARY: ["/dashboard", "/activities", "/attendance", "/feed"],
  MEMBER: ["/dashboard", "/activities", "/checkin", "/feed"],
};

export function mobileNav(role: Role): { main: NavItem[]; more: NavItem[] } {
  const all: NavItem[] = [...navFor(role), { href: "/settings", label: "Cài đặt", icon: Settings }];
  const keys = PRIMARY_MOBILE[role];
  // Tìm mục (kể cả nằm trong nhóm) cho 4 tab chính
  const flat = all.flatMap((i) => (i.children ? i.children.map((c) => ({ href: c.href, label: c.label, icon: c.icon ?? i.icon })) : [i]));
  const main = keys.map((k) => flat.find((i) => i.href === k)!);
  // "Thêm": bỏ các mục đã lên tab chính; nhóm còn 1 mục thì thành mục đơn
  const more: NavItem[] = [];
  for (const it of all) {
    if (!it.children) { if (!keys.includes(it.href)) more.push(it); continue; }
    const rest = it.children.filter((c) => !keys.includes(c.href));
    if (rest.length === it.children.length) more.push(it);
    else if (rest.length === 1) more.push({ href: rest[0].href, label: rest[0].label, icon: rest[0].icon ?? it.icon });
    else if (rest.length > 1) more.push({ ...it, href: rest[0].href, children: rest });
  }
  return { main, more };
}

export const ROLE_LABEL: Record<Role, string> = { ADMIN: "Quản trị viên", SECRETARY: "Bí thư Chi đoàn", MEMBER: "Đoàn viên" };

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Tổng quan", members: "Đoàn viên", departments: "Chi đoàn", activities: "Hoạt động", attendance: "Điểm danh",
  feed: "Bảng tin", marquee: "Dòng chữ chạy", cms: "Cổng thông tin", "tin-tuc": "Tin tức", "ke-hoach": "Kế hoạch", "su-kien": "Sự kiện", "thong-bao": "Thông báo", pages: "Trang giới thiệu", "chapter-reports": "Báo cáo Chi đoàn", emulation: "Thi đua", achievements: "Thành tích", reports: "Báo cáo", settings: "Cài đặt", profile: "Hồ sơ & thẻ số", checkin: "Quét QR điểm danh",
  history: "Lịch sử hoạt động", notifications: "Thông báo", polls: "Bình chọn", feedback: "Góp ý", approvals: "Hàng chờ duyệt", schedule: "Lịch công tác tuần", new: "Tạo mới", edit: "Chỉnh sửa",
};

/** Tiêu đề riêng cho đường dẫn cụ thể (ưu tiên hơn PAGE_TITLES theo đoạn). */
export const PATH_TITLES: Record<string, string> = {
  "/feed/new": "Đăng bài", "/cms/tin-tuc/new": "Đăng tin", "/cms/ke-hoach/new": "Đăng kế hoạch", "/cms/su-kien/new": "Tạo sự kiện", "/cms/thong-bao/new": "Đăng thông báo", "/chapter-reports/new": "Đăng báo cáo", "/members/new": "Thêm đoàn viên", "/activities/new": "Tạo hoạt động",
};
