import Link from "next/link";
import { DoanLogo } from "@/components/layout/logo";

export const metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <DoanLogo className="mb-3 h-16" />
        <h1 className="text-lg font-semibold">Quên mật khẩu</h1>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-white p-6 text-sm">
        <p>Tài khoản đoàn viên do nhà trường cấp nên mật khẩu không thể tự đặt lại qua email.</p>
        <p>Vui lòng liên hệ <b>Bí thư Chi đoàn</b> hoặc <b>Ban chấp hành Đoàn trường</b> để được cấp lại mật khẩu tạm thời. Bạn sẽ được yêu cầu đổi mật khẩu ngay trong lần đăng nhập kế tiếp.</p>
        <Link href="/login" className="inline-block text-primary hover:underline">← Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}
