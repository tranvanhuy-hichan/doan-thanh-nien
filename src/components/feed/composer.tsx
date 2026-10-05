"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createPostAction } from "@/actions/feed";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload";
import { Avatar } from "@/components/ui/misc";

export function PostComposer({ userName, avatarUrl, departments, fixedAudience }: {
  userName: string; avatarUrl: string | null; departments: { id: string; name: string }[]; fixedAudience?: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [dept, setDept] = useState("");
  const [image, setImage] = useState<UploadedImage>(null);
  
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await createPostAction({ content, departmentId: dept, imageUrl: image?.imageUrl ?? "", imagePublicId: image?.publicId ?? "" });
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    toast.success(res.message);
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex gap-3">
        <Avatar name={userName} src={avatarUrl} size={36} />
        <div className="min-w-0 flex-1 space-y-3">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Chia sẻ thông báo, hình ảnh hoạt động với đoàn viên..." className="min-h-40" maxLength={5000} />
          <ImageUpload folder="activities" value={image} onChange={setImage} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              
              {fixedAudience ? <span className="text-[13px] text-muted">Đăng cho Chi đoàn {fixedAudience}</span> : (
                <Select value={dept} onChange={(e) => setDept(e.target.value)} className="h-8 w-auto text-[13px]" aria-label="Đối tượng">
                  <option value="">Toàn trường</option>{departments.map((d) => <option key={d.id} value={d.id}>Chi đoàn {d.name}</option>)}
                </Select>
              )}
            </div>
            <div className="flex gap-2"><Button variant="secondary" onClick={() => router.back()}>Hủy</Button><Button loading={busy} disabled={!content.trim()} onClick={submit}>Đăng bài</Button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
