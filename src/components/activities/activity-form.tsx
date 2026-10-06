"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveActivityAction } from "@/actions/activities";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, WrapInput } from "@/components/ui/form";
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload";
import { fromLocalInput } from "@/utils";

type Values = {
  title: string; description: string; location: string; startAt: string; endAt: string; categoryId: string;
  departmentId: string; maxParticipants: string; points: string; volunteerHours: string;
};

export function ActivityForm({ id, categories, departments, lockedDepartment, initial, image, pointsLocked }: {
  id?: string;
  categories: { id: string; name: string; defaultPoints: number }[];
  departments: { id: string; name: string }[]; // rỗng nếu bí thư (Chi đoàn cố định)
  lockedDepartment?: string;
  initial?: Partial<Values>;
  image?: UploadedImage;
  pointsLocked?: boolean;
}) {
  const router = useRouter();
  const [img, setImg] = useState<UploadedImage>(image ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<Values>({
    defaultValues: { points: "3", volunteerHours: "0", departmentId: "", ...initial },
  });

  const onSubmit = handleSubmit(async (v) => {
    setErrors({});
    const res = await saveActivityAction(id ?? null, {
      ...v,
      startAt: v.startAt ? fromLocalInput(v.startAt).toISOString() : "",
      endAt: v.endAt ? fromLocalInput(v.endAt).toISOString() : "",
      imageUrl: img?.imageUrl ?? "", imagePublicId: img?.publicId ?? "",
    });
    if (!res.ok) {
      toast.error(res.error);
      if (res.fieldErrors) setErrors(Object.fromEntries(Object.entries(res.fieldErrors).map(([k, m]) => [k, m[0]])));
      return;
    }
    toast.success(res.message);
    router.push(`/activities/${res.data!.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5" noValidate>
      <Field label="Ảnh bìa hoạt động"><ImageUpload folder="activities" value={img} onChange={setImg} /></Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Tên hoạt động" required error={errors.title} className="sm:col-span-2 lg:col-span-3"><WrapInput {...register("title")} /></Field>
        <Field label="Loại hoạt động" required error={errors.categoryId}>
          <Select {...register("categoryId", { onChange: (e) => { if (!pointsLocked) { const c = categories.find((x) => x.id === e.target.value); if (c) setValue("points", String(c.defaultPoints)); } } })}>
            <option value="">Chọn loại</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Chi đoàn tổ chức" error={errors.departmentId}>
          {lockedDepartment ? <Input value={lockedDepartment} disabled readOnly /> : (
            <Select {...register("departmentId")}><option value="">Toàn trường</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
          )}
        </Field>
        <Field label="Bắt đầu" required error={errors.startAt}><Input type="datetime-local" {...register("startAt")} /></Field>
        <Field label="Kết thúc" required error={errors.endAt}><Input type="datetime-local" {...register("endAt")} /></Field>
        <Field label="Địa điểm" required error={errors.location} className="sm:col-span-2 lg:col-span-3"><Input {...register("location")} /></Field>
        <Field label="Số lượng tối đa" error={errors.maxParticipants} hint="Để trống nếu không giới hạn"><Input type="number" min={1} {...register("maxParticipants")} /></Field>
        <Field label="Điểm hoạt động" error={errors.points} hint={pointsLocked ? "Đã có người điểm danh nên không thể đổi" : "Tự động cộng khi điểm danh"}><Input type="number" min={0} disabled={pointsLocked} {...register("points")} /></Field>
        <Field label="Giờ tình nguyện" error={errors.volunteerHours}><Input type="number" min={0} step="0.5" disabled={pointsLocked} {...register("volunteerHours")} /></Field>
        <Field label="Mô tả" error={errors.description} className="sm:col-span-2 lg:col-span-3"><Textarea rows={5} {...register("description")} /></Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={isSubmitting}>{id ? "Lưu thay đổi" : "Tạo hoạt động"}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Hủy</Button>
      </div>
    </form>
  );
}
