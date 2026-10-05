"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { memberSchema } from "@/lib/validation";
import { createMemberAction, updateMemberAction, type Credential } from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/misc";

type In = z.input<typeof memberSchema>;
type Initial = Partial<Record<keyof In, string | number>> & { avatar?: UploadedImage };

export function MemberForm({ id, departments, initial }: { id?: string; departments: { id: string; name: string }[]; initial?: Initial }) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<UploadedImage>(initial?.avatar ?? null);
  const [created, setCreated] = useState<Credential | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<In>({
    resolver: zodResolver(memberSchema),
    defaultValues: { status: "ACTIVE", ...initial } as In,
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = { ...values, avatarUrl: avatar?.imageUrl ?? "", avatarPublicId: avatar?.publicId ?? "" };
    if (id) {
      const res = await updateMemberAction(id, payload);
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      router.push(`/members/${id}`);
      router.refresh();
    } else {
      const res = await createMemberAction(payload);
      if (!res.ok) return void toast.error(res.error);
      setCreated({ ...res.data!, department: departments.find((d) => d.id === values.departmentId)?.name ?? "" });
    }
  });

  return (
    <>
      <form onSubmit={onSubmit} className="w-full space-y-5" noValidate>
        <Field label="Ảnh đại diện"><ImageUpload folder="members" shape="square" value={avatar} onChange={setAvatar} /></Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Họ và tên" required error={errors.fullName?.message} className="sm:col-span-2 lg:col-span-3"><Input {...register("fullName")} /></Field>
          <Field label="Ngày sinh" error={errors.dateOfBirth?.message}><Input type="date" {...register("dateOfBirth")} /></Field>
          <Field label="Giới tính">
            <Select {...register("gender")}><option value="">—</option><option>Nam</option><option>Nữ</option><option>Khác</option></Select>
          </Field>
          <Field label="Chi đoàn" required error={errors.departmentId?.message}>
            <Select {...register("departmentId")}><option value="">Chọn Chi đoàn</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
          </Field>
          <Field label="Lớp" required error={errors.className?.message} hint="Ví dụ: 12A1"><Input {...register("className")} /></Field>
          <Field label="Khóa (năm nhập học)" error={errors.cohort?.message}><Input type="number" {...register("cohort")} /></Field>
          <Field label="Ngày vào Đoàn" error={errors.joinedAt?.message}><Input type="date" {...register("joinedAt")} /></Field>
          <Field label="Trạng thái sinh hoạt">
            <Select {...register("status")}><option value="ACTIVE">Đang sinh hoạt</option><option value="TRANSFERRED">Đã chuyển sinh hoạt</option><option value="GRADUATED">Đã ra trường</option></Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>{id ? "Lưu thay đổi" : "Thêm đoàn viên"}</Button>
          <Button variant="secondary" onClick={() => router.back()}>Hủy</Button>
        </div>
      </form>
      <Modal open={!!created} onClose={() => { setCreated(null); router.push("/members"); router.refresh(); }} title="Đã tạo tài khoản đoàn viên">
        {created && (
          <div className="space-y-3 text-sm">
            <Alert tone="green">Mật khẩu tạm thời chỉ hiển thị một lần. Đoàn viên phải đổi mật khẩu ở lần đăng nhập đầu tiên.</Alert>
            <dl className="grid grid-cols-[130px_1fr] gap-y-1.5">
              <dt className="text-muted">Họ tên</dt><dd>{created.fullName}</dd>
              <dt className="text-muted">Tên đăng nhập</dt><dd className="font-mono">{created.code}</dd>
              <dt className="text-muted">Mật khẩu tạm</dt><dd className="font-mono">{created.password}</dd>
            </dl>
            <div className="flex justify-end"><Button onClick={() => { setCreated(null); router.push("/members"); router.refresh(); }}>Đóng</Button></div>
          </div>
        )}
      </Modal>
    </>
  );
}
