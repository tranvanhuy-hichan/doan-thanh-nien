import { Award, BarChart3, CalendarDays, CheckSquare, IdCard, LayoutDashboard, Newspaper, QrCode, Trophy, School, History, Users, type LucideIcon } from "lucide-react";
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
  return [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/feed", label: "Bảng tin", icon: Newspaper },
    { href: "/members", label: "Đoàn viên", icon: Users },
    { href: "/departments", label: role === "ADMIN" ? "Chi đoàn" : "Chi đoàn của tôi", icon: School },
    { href: "/activities", label: "Hoạt động", icon: CalendarDays },
    { href: "/attendance", label: "Điểm danh", icon: CheckSquare },
    { href: "/emulation", label: "Thi đua", icon: Trophy },
    { href: "/achievements", label: "Thành tích", icon: Award },
    { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  ];
}

export const ROLE_LABEL: Record<Role, string> = { ADMIN: "Quản trị viên", SECRETARY: "Bí thư Chi đoàn", MEMBER: "Đoàn viên" };

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Tổng quan", members: "Đoàn viên", departments: "Chi đoàn", activities: "Hoạt động", attendance: "Điểm danh",
  feed: "Bảng tin", emulation: "Thi đua", achievements: "Thành tích", reports: "Báo cáo", settings: "Cài đặt", profile: "Hồ sơ & thẻ số", checkin: "Quét QR điểm danh",
  history: "Lịch sử hoạt động", notifications: "Thông báo", new: "Tạo mới", edit: "Chỉnh sửa",
};
