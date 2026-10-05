import { requireUser } from "@/lib/auth/session";
import { DoanLogo } from "@/components/layout/logo";
import { ChangePasswordForm } from "@/components/members/change-password-form";

export const metadata = { title: "Đổi mật khẩu" };

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <DoanLogo className="mb-3 h-16" />
        <h1 className="text-lg font-semibold">{user.mustChangePassword ? "Đặt mật khẩu mới" : "Đổi mật khẩu"}</h1>
        {user.mustChangePassword && <p className="mt-1 text-sm text-muted">Đây là lần đăng nhập đầu tiên, bạn cần đổi mật khẩu tạm thời trước khi tiếp tục.</p>}
      </div>
      <div className="rounded-lg border border-border bg-white/85 p-6">
        <ChangePasswordForm redirectTo="/dashboard" />
      </div>
    </div>
  );
}
