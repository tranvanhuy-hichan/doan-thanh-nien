import { DoanLogo } from "./logo";

/** Phần đầu các trang xác thực (nền xanh Đoàn): logo lớn trong vòng tròn trắng + tên trường. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col items-center text-center text-white">
      <span className="mb-4 flex size-28 items-center justify-center rounded-full bg-white shadow-lg"><DoanLogo className="h-[5.5rem]" /></span>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-blue-100">{subtitle}</p>}
    </div>
  );
}
