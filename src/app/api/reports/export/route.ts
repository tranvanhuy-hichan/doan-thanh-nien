import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/session";
import { activityReport, memberReport } from "@/lib/services/reports";
import { formatDateTime, formatHours } from "@/utils";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || user.role === "MEMBER") return new Response("Forbidden", { status: 403 });
  const month = new URL(req.url).searchParams.get("month") ?? undefined;

  const [acts, members] = await Promise.all([activityReport(user, month), memberReport(user)]);
  const wb = new ExcelJS.Workbook();
  const ws1 = wb.addWorksheet("Hoạt động");
  ws1.columns = [
    { header: "Hoạt động", width: 38 }, { header: "Loại", width: 16 }, { header: "Thời gian", width: 20 }, { header: "Tổ chức", width: 14 },
    { header: "Đăng ký", width: 10 }, { header: "Tham gia", width: 10 }, { header: "Tỷ lệ (%)", width: 10 },
  ];
  acts.forEach((a) => ws1.addRow([a.title, a.category.name, formatDateTime(a.startAt), a.department?.name ?? "Toàn trường", a._count.registrations, a._count.attendances, a.rate]));
  const ws2 = wb.addWorksheet("Đoàn viên");
  ws2.columns = [
    { header: "Mã đoàn viên", width: 16 }, { header: "Họ tên", width: 28 }, { header: "Lớp", width: 8 }, { header: "Chi đoàn", width: 12 },
    { header: "Hoạt động", width: 11 }, { header: "Điểm", width: 8 }, { header: "Giờ tình nguyện", width: 16 }, { header: "Huy hiệu", width: 10 },
  ];
  members.forEach((m) => ws2.addRow([m.code, m.fullName, m.class.name, m.department.name, m._count.attendances, m.totalPoints, formatHours(m.volunteerMinutes), m._count.badges]));
  [ws1, ws2].forEach((w) => (w.getRow(1).font = { bold: true }));

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bao-cao-doan${month ? "-" + month : ""}.xlsx"`,
    },
  });
}
