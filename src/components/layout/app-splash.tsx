"use client";
import { useEffect } from "react";

/**
 * Màn hình chờ khi mở ứng dụng đã cài lên màn hình chính (PWA): nền xanh Đoàn + huy hiệu + tên hệ thống,
 * hiện ngay từ khung hình đầu tiên (HTML có sẵn, CSS nội tuyến) và mờ dần khi ứng dụng đã sẵn sàng.
 * Chỉ hiện ở chế độ "standalone" (đã cài), trình duyệt thường không thấy.
 */
export function AppSplash() {
  useEffect(() => {
    const el = document.getElementById("app-splash");
    if (!el) return;
    const done = () => { el.classList.add("hide"); setTimeout(() => el.remove(), 450); };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    const t = setTimeout(done, 6000); // phòng khi mạng chậm: không chặn màn hình quá 6 giây
    return () => clearTimeout(t);
  }, []);
  return null;
}

export const SPLASH_CSS = `
#app-splash{display:none}
@media (display-mode: standalone){
  html{background:#0b63b8}
  #app-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#0b63b8;color:#fff;text-align:center;transition:opacity .4s ease}
  #app-splash.hide{opacity:0;pointer-events:none}
  #app-splash img{height:112px;width:auto}
  #app-splash b{font-size:20px;font-weight:700;letter-spacing:.2px}
  #app-splash span{font-size:13px;color:#cfe3f7}
  #app-splash img{animation:sp-pulse 1.6s ease-in-out infinite}
  #app-splash i{display:block;margin-top:18px;width:30px;height:30px;border:3px solid rgba(255,255,255,.28);border-top-color:#ffd400;border-radius:50%;animation:sp-spin .8s linear infinite}
}
@keyframes sp-spin{to{transform:rotate(360deg)}}
@keyframes sp-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@media (prefers-reduced-motion: reduce){#app-splash img,#app-splash i{animation:none}}`;
