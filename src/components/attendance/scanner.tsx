"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";
import { extractToken } from "@/lib/qr/extract";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert } from "@/components/ui/misc";

export function Scanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string>();
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const tick = () => {
          if (stopped) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA) {
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            const token = code && extractToken(code.data);
            if (token) { stopped = true; router.push(`/checkin?t=${encodeURIComponent(token)}`); return; }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError("Không truy cập được camera. Hãy cấp quyền camera cho trình duyệt (cần HTTPS) hoặc dán liên kết điểm danh bên dưới.");
        setActive(false);
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [active, router]);

  return (
    <div className="max-w-md space-y-5">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-slate-900">
        <video ref={video} muted playsInline className="size-full object-cover" />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 text-center">
            <CameraOff className="size-8 text-slate-300" />
            <Button onClick={() => { setError(undefined); setActive(true); }}><Camera className="size-4" />Bật camera quét QR</Button>
          </div>
        )}
        {active && <div className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-white/80" />}
      </div>
      {active && <Button variant="secondary" onClick={() => setActive(false)}>Tắt camera</Button>}
      {error && <Alert>{error}</Alert>}
      <form className="space-y-2" onSubmit={(e) => {
        e.preventDefault();
        const token = extractToken(manual);
        if (!token) return setError("Liên kết hoặc mã không hợp lệ");
        router.push(`/checkin?t=${encodeURIComponent(token)}`);
      }}>
        <Field label="Hoặc dán liên kết điểm danh" hint="Có thể dùng camera điện thoại quét QR rồi mở liên kết."><Input value={manual} onChange={(e) => setManual(e.target.value)} /></Field>
        <Button type="submit" variant="secondary" disabled={!manual.trim()}>Tiếp tục</Button>
      </form>
    </div>
  );
}
