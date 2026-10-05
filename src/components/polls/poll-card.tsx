"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock, Trash2, Unlock } from "lucide-react";
import { deletePollAction, setPollClosedAction, votePollAction } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/modal";
import { reportResult } from "@/components/ui/submit";
import { cn } from "@/utils";

export type PollView = {
  id: string; question: string; description: string | null; multiple: boolean; closesAt: string | null; ended: boolean; closed: boolean;
  options: { id: string; text: string; votes: number }[]; totalVoters: number; mine: string[];
};

export function PollCard({ poll, isAdmin }: { poll: PollView; isAdmin: boolean }) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>(poll.mine);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const showResults = poll.ended || (poll.mine.length > 0 && !editing);
  const max = Math.max(1, ...poll.options.map((o) => o.votes));
  const toggle = (id: string) => setSel(poll.multiple ? (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]) : [id]);

  return (
    <section className="rounded-lg border border-primary/20 bg-white/85 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">{poll.question}</h2>
          {poll.description && <p className="mt-0.5 text-sm text-muted">{poll.description}</p>}
          <p className="mt-1 text-xs text-muted">
            {poll.ended ? "Đã kết thúc" : poll.closesAt ? `Đến ${new Date(poll.closesAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" })}` : "Không giới hạn thời gian"} · {poll.totalVoters} người tham gia{poll.multiple && " · chọn được nhiều"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" aria-label={poll.closed ? "Mở lại" : "Kết thúc"} title={poll.closed ? "Mở lại" : "Kết thúc"} onClick={async () => { reportResult(await setPollClosedAction(poll.id, !poll.closed)); router.refresh(); }}>
              {poll.closed ? <Unlock className="size-4" /> : <Lock className="size-4" />}
            </Button>
            <ConfirmButton triggerVariant="ghost" triggerClassName="text-danger" triggerLabel="Xóa" trigger={<Trash2 className="size-4" />} title="Xóa bình chọn?" description="Toàn bộ phiếu bầu sẽ bị xóa." danger confirmLabel="Xóa"
              onConfirm={async () => { reportResult(await deletePollAction(poll.id)); router.refresh(); }} />
          </div>
        )}
      </div>

      {showResults ? (
        <ul className="mt-3 space-y-2">
          {poll.options.map((o) => {
            const pct = poll.totalVoters ? Math.round((o.votes / poll.totalVoters) * 100) : 0;
            const mine = poll.mine.includes(o.id);
            return (
              <li key={o.id} className="relative overflow-hidden rounded-md border border-border">
                <div className={cn("absolute inset-y-0 left-0", o.votes === max && o.votes > 0 ? "bg-primary/25" : "bg-primary-light")} style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">{mine && <CheckCircle2 className="size-4 shrink-0 text-primary" />}<span className="truncate">{o.text}</span></span>
                  <span className="shrink-0 font-semibold tabular-nums">{pct}% <span className="font-normal text-muted">({o.votes})</span></span>
                </div>
              </li>
            );
          })}
          {!poll.ended && <li><Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Đổi lựa chọn</Button></li>}
        </ul>
      ) : (
        <div className="mt-3 space-y-2">
          {poll.options.map((o) => (
            <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm", sel.includes(o.id) ? "border-primary bg-primary-light" : "border-border hover:bg-slate-50")}>
              <input type={poll.multiple ? "checkbox" : "radio"} name={poll.id} checked={sel.includes(o.id)} onChange={() => toggle(o.id)} className="size-4 accent-[#0b63b8]" />
              <span>{o.text}</span>
            </label>
          ))}
          <Button loading={busy} disabled={!sel.length} onClick={async () => {
            setBusy(true); const res = await votePollAction(poll.id, sel); setBusy(false);
            if (!res.ok) return void toast.error(res.error);
            toast.success(res.message); setEditing(false); router.refresh();
          }}>Bình chọn</Button>
        </div>
      )}
    </section>
  );
}
