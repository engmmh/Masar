// مسار service worker: يفتح الموقع بسرعة ويعمل دون إنترنت للواجهة (البيانات تتزامن عند الاتصال)
const CACHE = "masar-v12";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co")) return; // البيانات دائمًا من الشبكة
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", cp)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === "opaque")) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});

// تذكير يومي (كلمة/جملة إنجليزي) عبر Web Push
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (er) {}
  const title = data.title || "مسار";
  const body = data.body || "";
  const en = data.en || "";
  e.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    dir: "rtl",
    lang: "ar",
    tag: "masar-daily-" + Date.now(),
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    data: { en }
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const en = (e.notification.data && e.notification.data.en) || "";
  const target = "./" + (en ? "?speak=" + encodeURIComponent(en) : "");
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ("focus" in c) {
        if (en) c.postMessage({ type: "masar-speak", en: en });
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});
