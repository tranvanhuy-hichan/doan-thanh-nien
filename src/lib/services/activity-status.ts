export type ActivityStatus = "UPCOMING" | "ONGOING" | "ENDED" | "CANCELLED";

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  UPCOMING: "Sắp diễn ra",
  ONGOING: "Đang diễn ra",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

export function activityStatus(a: { startAt: Date; endAt: Date; cancelledAt: Date | null }, now = new Date()): ActivityStatus {
  if (a.cancelledAt) return "CANCELLED";
  if (now < a.startAt) return "UPCOMING";
  if (now <= a.endAt) return "ONGOING";
  return "ENDED";
}

/** Cho phép mở điểm danh từ 60 phút trước giờ bắt đầu đến 120 phút sau giờ kết thúc. */
export function canOpenCheckin(a: { startAt: Date; endAt: Date; cancelledAt: Date | null }, now = new Date()) {
  if (a.cancelledAt) return false;
  return now.getTime() >= a.startAt.getTime() - 60 * 60_000 && now.getTime() <= a.endAt.getTime() + 120 * 60_000;
}
