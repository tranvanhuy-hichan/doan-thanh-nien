"use client";
import { useState } from "react";
import { Avatar } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";

export type TopMember = { id: string; rank: number; name: string; avatarUrl: string | null; department: string; attendances: number; badges: number; points: number };

/** Danh sách đoàn viên tiêu biểu cho mobile: hạng, tên, điểm; bấm để xem chi tiết. */
export function TopMembersList({ items }: { items: TopMember[] }) {
  const [sel, setSel] = useState<TopMember | null>(null);
  return (
    <>
      <ul className="divide-y divide-border rounded-lg border border-border bg-white/85 sm:hidden">
        {items.map((m) => (
          <li key={m.id}>
            <button onClick={() => setSel(m)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${m.rank <= 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>{m.rank}</span>
              <Avatar name={m.name} src={m.avatarUrl} size={28} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.name}</span>
              <span className="font-semibold tabular-nums">{m.points}</span>
            </button>
          </li>
        ))}
      </ul>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ""} className="max-w-sm">
        {sel && (
          <dl className="divide-y divide-border text-sm">
            {([["Hạng", sel.rank], ["Chi đoàn", sel.department], ["Hoạt động đã tham gia", sel.attendances], ["Huy hiệu", sel.badges], ["Điểm", sel.points]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted">{k}</dt><dd className="text-right tabular-nums">{v}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
