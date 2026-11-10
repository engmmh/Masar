// مسار — service worker.
// The app shell (every file index.html loads) is precached as ONE versioned set and
// served straight from that set, so the app opens instantly and always shows a single,
// consistent version. CACHE_NAME and PRECACHE are written by scripts/build-sw.js from a
// hash of those files: any change to the app gives a new name, the new set is fetched
// fresh (bypassing the browser cache), and on activation every older set is deleted.
// Other same-origin files (courses, Quran text, OCR data) are network-first with the
// cache as offline fallback.
// BUILD:START
var CACHE_NAME = "masar-1dbc459afb";
var PRECACHE = [
  "./index.html",
  "./admin.js",
  "./app.js",
  "./boot.js",
  "./coach-data.js",
  "./coach.js",
  "./fit-data.js",
  "./fit-ocr.js",
  "./fit.js",
  "./food-data.js",
  "./food.js",
  "./games.js",
  "./gloss-data.js",
  "./hifz.js",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./intro.js",
  "./learn.js",
  "./manifest.webmanifest",
  "./money-plus.js",
  "./money.js",
  "./prayer.js",
  "./quran-plus.js",
  "./styles.css",
  "./talk-data.js",
  "./talk.js",
  "./theme-init.js",
  "./tools.js",
  "./touch-glow.js",
  "./vendor/supabase.js",
  "./welcome.js"
];
// BUILD:END
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
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // All or nothing: if any file can't be fetched, this version doesn't install and
      // the previous one keeps serving — never a half-updated app.
      return Promise.all(PRECACHE.map(function (u) {
        return fetch(new Request(u, { cache: "reload" })).then(function (r) {
          if (!r.ok) throw new Error("precache " + u);
          return cache.put(u, r);
        });
      }));
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
    jobs.push(inboxAdd({ id: data.id || String(Date.now()), en: data.en, ar: data.ar || lines[1] || "", hint: data.hint || "", at: Date.now() }));
  }
  event.waitUntil(Promise.all(jobs));
});

// The browser can rotate a subscription on its own; subscribe again with the same key
// right away so pushes keep arriving (the app saves the new one to the server the next
// time it's opened).
self.addEventListener("pushsubscriptionchange", function (event) {
  var key = event.oldSubscription && event.oldSubscription.options && event.oldSubscription.options.applicationServerKey;
  if (!key) return;
  event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }).catch(function () { }));
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

var SHELL = {};
PRECACHE.forEach(function (u) { SHELL[new URL(u, self.location).pathname] = 1; });
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, fonts, CDNs: untouched

  // Page loads and app files: from this version's set (instant, consistent).
  if (req.mode === "navigate" || SHELL[url.pathname]) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function (c) {
        return c.match(req.mode === "navigate" ? "./index.html" : url.pathname, { ignoreSearch: true }).then(function (hit) {
          return hit || fetch(req);
        });
      })
    );
    return;
  }
  // Everything else: fresh from the network (revalidated), cache as offline fallback.
  event.respondWith(
    fetch(req, { cache: "no-cache" }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) { return cached || Response.error(); });
    })
  );
});
