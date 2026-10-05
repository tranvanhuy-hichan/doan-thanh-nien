import { Settings, Award, BarChart3, CalendarDays, CheckSquare, IdCard, LayoutDashboard, Newspaper, QrCode, Trophy, School, History, Users, type LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: LucideIcon };

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
    ];
  }
  return [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/feed", label: "Bảng tin", icon: Newspaper },
    { href: "/members", label: "Đoàn viên", icon: Users },
    { href: "/departments", label: "Chi đoàn", icon: School },
    { href: "/activities", label: "Hoạt động", icon: CalendarDays },
    { href: "/attendance", label: "Điểm danh", icon: CheckSquare },
    { href: "/emulation", label: "Thi đua", icon: Trophy },
    { href: "/achievements", label: "Thành tích", icon: Award },
    { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  ];
}

/** Thanh điều hướng dưới (mobile): 4 mục dùng nhiều nhất theo vai trò, phần còn lại nằm trong nút "Thêm". */
const PRIMARY_MOBILE: Record<Role, string[]> = {
  ADMIN: ["/dashboard", "/members", "/activities", "/feed"],
  SECRETARY: ["/dashboard", "/activities", "/attendance", "/feed"],
  MEMBER: ["/dashboard", "/activities", "/checkin", "/feed"],
};

export function mobileNav(role: Role): { main: NavItem[]; more: NavItem[] } {
  const all = [...navFor(role), { href: "/settings", label: "Cài đặt", icon: Settings }];
  const keys = PRIMARY_MOBILE[role];
  return { main: keys.map((k) => all.find((i) => i.href === k)!), more: all.filter((i) => !keys.includes(i.href)) };
}

export const ROLE_LABEL: Record<Role, string> = { ADMIN: "Quản trị viên", SECRETARY: "Bí thư Chi đoàn", MEMBER: "Đoàn viên" };

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Tổng quan", members: "Đoàn viên", departments: "Chi đoàn", activities: "Hoạt động", attendance: "Điểm danh",
  feed: "Bảng tin", emulation: "Thi đua", achievements: "Thành tích", reports: "Báo cáo", settings: "Cài đặt", profile: "Hồ sơ & thẻ số", checkin: "Quét QR điểm danh",
  history: "Lịch sử hoạt động", notifications: "Thông báo", new: "Tạo mới", edit: "Chỉnh sửa",
};

/** Tiêu đề riêng cho đường dẫn cụ thể (ưu tiên hơn PAGE_TITLES theo đoạn). */
export const PATH_TITLES: Record<string, string> = {
  "/feed/new": "Đăng bài", "/members/new": "Thêm đoàn viên", "/activities/new": "Tạo hoạt động",
};
