import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Đoàn viên");
  ws.columns = [
    { header: "Họ tên", key: "a", width: 28 }, { header: "Ngày sinh", key: "b", width: 14 }, { header: "Giới tính", key: "c", width: 10 },
    { header: "Lớp", key: "d", width: 10 }, { header: "Chi đoàn", key: "e", width: 14 }, { header: "Khóa", key: "f", width: 8 },
    { header: "Ngày vào Đoàn", key: "g", width: 16 },
  ];
  ws.getRow(1).font = { bold: true };
  const guide = wb.addWorksheet("Hướng dẫn");
  guide.getColumn(1).width = 90;
  [
    "Bắt buộc: Họ tên, Lớp. Các cột còn lại có thể để trống.",
    "Chi đoàn để trống thì dùng tên Lớp làm tên Chi đoàn. Chi đoàn phải được tạo trước trong hệ thống.",
    "Ngày sinh / Ngày vào Đoàn theo định dạng dd/mm/yyyy. Giới tính: Nam, Nữ hoặc Khác.",
    "Mã đoàn viên (tên đăng nhập) và mật khẩu tạm thời được hệ thống tự sinh sau khi nhập.",
  ].forEach((t) => guide.addRow([t]));
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mau-import-doan-vien.xlsx"',
    },
  });
}
