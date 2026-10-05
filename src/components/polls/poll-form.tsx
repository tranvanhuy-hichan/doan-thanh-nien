"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { createPollAction } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { fromLocalInput } from "@/utils";

export function PollForm() {
  const router = useRouter();
  const [v, setV] = useState({ question: "", description: "", multiple: false, closesAt: "" });
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  return (
    <div className="w-full max-w-2xl space-y-4">
      <Field label="Câu hỏi" required><Input value={v.question} maxLength={200} placeholder="Ví dụ: Chủ đề hoạt động tháng sau?" onChange={(e) => setV({ ...v, question: e.target.value })} /></Field>
      <Field label="Mô tả"><Textarea className="min-h-16" maxLength={500} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
      <Field label="Các lựa chọn" required>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input value={o} maxLength={120} placeholder={`Lựa chọn ${i + 1}`} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
              {options.length > 2 && <Button variant="ghost" size="sm" aria-label="Xóa lựa chọn" onClick={() => setOptions(options.filter((_, j) => j !== i))}><X className="size-4" /></Button>}
            </div>
          ))}
          {options.length < 10 && <Button variant="secondary" size="sm" onClick={() => setOptions([...options, ""])}><Plus className="size-4" />Thêm lựa chọn</Button>}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hạn bình chọn" hint="Để trống nếu không giới hạn"><Input type="datetime-local" value={v.closesAt} onChange={(e) => setV({ ...v, closesAt: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm sm:mt-6"><input type="checkbox" className="size-4 accent-[#0b63b8]" checked={v.multiple} onChange={(e) => setV({ ...v, multiple: e.target.checked })} />Cho phép chọn nhiều</label>
      </div>
      <div className="flex gap-2">
        <Button loading={busy} onClick={async () => {
          setBusy(true);
          const res = await createPollAction({ ...v, closesAt: v.closesAt ? fromLocalInput(v.closesAt).toISOString() : "", options: options.filter((o) => o.trim()) });
          setBusy(false);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message); router.push("/polls"); router.refresh();
        }}>Tạo bình chọn</Button>
        <Button variant="secondary" onClick={() => router.back()}>Hủy</Button>
      </div>
    </div>
  );
}
