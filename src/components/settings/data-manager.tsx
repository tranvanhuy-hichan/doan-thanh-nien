"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { runCleanupAction } from "@/actions/cleanup";
import { ConfirmButton } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";
import { DataTable, Td, Th } from "@/components/ui/misc";

const mb = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function DataManager({ totalBytes, tables, retention }: {
  totalBytes: number; tables: { name: string; rows: number; bytes: number }[]; retention: { notificationRead: number; notificationAny: number; auditLog: number };
}) {
  const router = useRouter();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="text-xs text-muted">Dung lượng database đang dùng</div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums">{mb(totalBytes)}</div>
      </div>
      <div>
        <h3 className="mb-2 text-[15px] font-semibold">Bảng lớn nhất</h3>
        <DataTable>
          <thead><tr><Th>Bảng</Th><Th className="text-right">Số dòng</Th><Th className="text-right">Dung lượng</Th></tr></thead>
          <tbody>{tables.map((t) => <tr key={t.name}><Td className="font-mono text-[13px]">{t.name}</Td><Td className="text-right tabular-nums">{t.rows.toLocaleString("vi-VN")}</Td><Td className="text-right tabular-nums">{mb(t.bytes)}</Td></tr>)}</tbody>
        </DataTable>
      </div>
      <div>
        <h3 className="mb-1 text-[15px] font-semibold">Dọn dữ liệu cũ tự động</h3>
        <p className="mb-3 text-sm text-muted">
          Mỗi ngày hệ thống tự xóa thông báo đã đọc quá {retention.notificationRead} ngày, thông báo chưa đọc quá {retention.notificationAny} ngày và nhật ký hệ thống quá {retention.auditLog} ngày.
          Điểm danh, điểm, huy hiệu, báo cáo và bài viết được giữ lâu dài.
        </p>
        <ConfirmButton triggerVariant="secondary" trigger={<><Trash2 className="size-4" />Dọn ngay</>} title="Dọn dữ liệu cũ ngay?" confirmLabel="Dọn ngay"
          description="Xóa các thông báo và nhật ký đã quá hạn giữ nêu trên. Không thể hoàn tác."
          onConfirm={async () => { reportResult(await runCleanupAction()); router.refresh(); }} />
      </div>
    </div>
  );
}
