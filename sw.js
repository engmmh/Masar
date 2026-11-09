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
var CACHE_NAME = "masar-v40";
var INBOX = "masar-inbox";
function inboxRead() {
  return caches.open(INBOX).then(function (c) { return c.match("inbox.json"); }).then(function (r) { return r ? r.json() : []; }).catch(function () { return []; });
}
function inboxAdd(item) {
  return inboxRead().then(function (list) {
    var cut = Date.now() - 2 * 864e5;
    list = (list || []).filter(function (x) { return x && x.at > cut && x.id !== item.id; });
    list.push(item); list = list.slice(-120);
    return caches.open(INBOX).then(function (c) { return c.put("inbox.json", new Response(JSON.stringify(list), { headers: { "content-type": "application/json" } })); });
  });
}
var PRECACHE = [
  "./",
  "./index.html",
  "./vendor/supabase.js",
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
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME && n !== INBOX; }).map(function (n) { return caches.delete(n); }));
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
  // The every-15-minutes nudges share one tag, so each new one replaces the last
  // instead of piling up; renotify keeps its (soft, system-default) sound.
  var opts = { body: body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", dir: "rtl", lang: "ar", data: { go: data.go || "", id: data.id || "" } };
  if (data.tag) { opts.tag = data.tag; opts.renotify = true; }
  var jobs = [self.registration.showNotification(title, opts)];
  // English sentences are also kept on the phone so the app can show «جمل النهارده»
  // (even the ones that weren't tapped). Kept 2 days; the app shows today's.
  if (data.type === "en" && data.en) {
    var lines = String(body).split("\n");
    jobs.push(inboxAdd({ id: data.id || String(Date.now()), en: data.en, ar: data.ar || lines[1] || "", at: Date.now() }));
  }
  event.waitUntil(Promise.all(jobs));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var nd = event.notification.data || {}, go = nd.go || "", gid = nd.id || "";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) { if (go) list[i].postMessage({ masarGo: go, id: gid }); return list[i].focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow("./" + (go ? "?go=" + go + (gid ? "&id=" + encodeURIComponent(gid) : "") : ""));
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
      // Only a page navigation falls back to the app shell; a missing script or data
      // file must fail as itself, not be answered with index.html.
      return caches.match(req).then(function (cached) {
        return cached || (req.mode === "navigate" ? caches.match("./index.html") : Response.error());
      });
    })
  );
});
