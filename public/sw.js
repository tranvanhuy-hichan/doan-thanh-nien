// Service worker: nhận thông báo đẩy và hiển thị trên thiết bị (cả khi đã đóng app).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: event.data ? event.data.text() : "Thông báo mới" }; }
  const title = data.title || "Đoàn trường THPT Sơn Hà";
  event.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || undefined,
      renotify: !!data.tag,
      vibrate: [120, 60, 120],
      data: { url: data.url || "/dashboard" },
    });
    // Tab đang mở: báo để trang phát âm thanh và làm mới danh sách thông báo.
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    windows.forEach((c) => c.postMessage({ type: "push", title }));
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of windows) {
      if ("focus" in c) { await c.focus(); if ("navigate" in c) { try { await c.navigate(url); } catch {} } return; }
    }
    await self.clients.openWindow(url);
  })());
});
