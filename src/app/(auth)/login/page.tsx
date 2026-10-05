import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DoanLogo } from "@/components/layout/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <DoanLogo className="mb-3 h-16" />
        <h1 className="text-lg font-semibold">Trường THPT Sơn Hà</h1>
        <p className="text-sm text-muted">Đoàn TNCS Hồ Chí Minh</p>
      </div>
      <div className="rounded-lg border border-border bg-white p-6">
        <LoginForm next={safeNext} />
      </div>
    </div>
  );
}
