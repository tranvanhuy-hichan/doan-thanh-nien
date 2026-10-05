import { cn } from "@/utils";

/** Huy hiệu Đoàn TNCS Hồ Chí Minh (public/logo-doan.png). `className` đặt chiều cao, chiều rộng tự theo tỷ lệ ảnh. */
export function DoanLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-doan.png" alt="Huy hiệu Đoàn TNCS Hồ Chí Minh" width={425} height={468} className={cn("h-10 w-auto object-contain", className)} />
  );
}
