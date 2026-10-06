import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/utils";

const control = "w-full rounded-md border border-border bg-white/85 px-3 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-50 disabled:text-muted";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, "h-9", className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-24 py-2", className)} {...p} />;
});
/** Ô nhập một dòng nhưng chữ dài thì tự xuống dòng và cao dần (dùng cho tiêu đề). Enter không tạo dòng mới. */
export const WrapInput = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function WrapInput({ className, onInput, onKeyDown, ...p }, ref) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const fit = useCallback(() => {
    const el = inner.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight + 2}px`; }
  }, []);
  useLayoutEffect(fit); // chạy sau mỗi lần render (giá trị đổi từ ngoài)
  return (
    <textarea
      ref={(el) => { inner.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }}
      rows={1}
      className={cn(control, "min-h-9 resize-none overflow-hidden py-[7px] leading-normal", className)}
      onInput={(e) => { fit(); onInput?.(e); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); onKeyDown?.(e); }}
      {...p}
    />
  );
});
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return <select ref={ref} className={cn(control, "h-9 pr-8", className)} {...p}>{children}</select>;
});

export function Field({ label, error, hint, required, children, className }: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[13px] font-medium">{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
