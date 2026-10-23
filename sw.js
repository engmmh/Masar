// مسار — service worker: makes the app installable on the phone's home screen
// and lets it still open (with the last-known content) when offline.
// Strategy: network-first for same-origin files (always prefer fresh content —
// this covers the course json files under courses/, which are fetched directly
// from this same-origin folder, not from Supabase; progress/settings/account data
// is the only thing that comes from Supabase, and that's untouched by this file),
// falling back to the cache only when the network is unavailable.
// jspdf.umd.min.js is intentionally NOT precached here: it's ~420KB and only
// loaded on-demand (see loadJspdfScript() in index.html) when a certificate is
// actually downloaded, so precaching it would waste bandwidth on every install
// for a feature most sessions never use.
var CACHE_NAME = "masar-v4";
var PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () { /* ignore individual failures */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Shows the actual notification for a push message — enablePush()/disablePush() in
// index.html only create the subscription; without this listener, a push sent to
// that subscription (the daily reminder, or the admin's "🔔 ابعت تذكير" button)
// would arrive but never be displayed on the device.
self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { }
  var title = data.title || "مسار";
  var body = data.body || "افتح مسار كمّل.";
  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    dir: "rtl",
    lang: "ar"
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (list) {
      for (var i = 0; i < list.length; i++) { if ("focus" in list[i]) return list[i].focus(); }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave Supabase/CDN/font requests alone

  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        return cached || caches.match("./index.html");
      });
    })
  );
});
