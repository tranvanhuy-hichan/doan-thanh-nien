import { FileText, Globe, Settings, Award, BarChart3, CalendarDays, CheckSquare, IdCard, LayoutDashboard, Newspaper, QrCode, Trophy, School, History, Users, type LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Tiền tố đường dẫn coi là đang ở mục này (mặc định = href). */ match?: string; /** Menu con (hiển thị dạng nhóm mở/đóng). */ children?: { href: string; label: string }[] };

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
      { href: "/chapter-reports", label: "Báo cáo Chi đoàn", icon: FileText },
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
    {
      href: "/cms/tin-tuc", label: "Website công khai", icon: Globe, match: "/cms",
      children: [
        { href: "/cms/tin-tuc", label: "Tin tức" }, { href: "/cms/ke-hoach", label: "Kế hoạch" }, { href: "/cms/su-kien", label: "Sự kiện" },
        { href: "/cms/thong-bao", label: "Thông báo" }, { href: "/cms/pages", label: "Trang giới thiệu" },
        { href: "/chapter-reports", label: "Báo cáo Chi đoàn" }, { href: "/cms/settings", label: "Thông tin website" },
      ],
    },
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
  feed: "Bảng tin", cms: "Website công khai", "tin-tuc": "Tin tức", "ke-hoach": "Kế hoạch", "su-kien": "Sự kiện", "thong-bao": "Thông báo", pages: "Trang giới thiệu", "chapter-reports": "Báo cáo Chi đoàn", emulation: "Thi đua", achievements: "Thành tích", reports: "Báo cáo", settings: "Cài đặt", profile: "Hồ sơ & thẻ số", checkin: "Quét QR điểm danh",
  history: "Lịch sử hoạt động", notifications: "Thông báo", new: "Tạo mới", edit: "Chỉnh sửa",
};

/** Tiêu đề riêng cho đường dẫn cụ thể (ưu tiên hơn PAGE_TITLES theo đoạn). */
export const PATH_TITLES: Record<string, string> = {
  "/feed/new": "Đăng bài", "/cms/tin-tuc/new": "Đăng tin", "/cms/ke-hoach/new": "Đăng kế hoạch", "/cms/su-kien/new": "Tạo sự kiện", "/cms/thong-bao/new": "Đăng thông báo", "/chapter-reports/new": "Đăng báo cáo", "/members/new": "Thêm đoàn viên", "/activities/new": "Tạo hoạt động",
};
