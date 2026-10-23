"use strict";
  /* ---------------- constants ---------------- */
  var LAT = 24.7136, LNG = 46.6753, TZ = 3;
  var PRAYERS = [
    { k: "fajr", n: "الفجر" }, { k: "dhuhr", n: "الظهر" }, { k: "asr", n: "العصر" },
    { k: "maghrib", n: "المغرب" }, { k: "isha", n: "العشاء" }
  ];
  var WD = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  var WD_S = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  var UNITS = { page: { n: "صفحات", f: 1 }, half: { n: "نصف جزء", f: 10 }, juz: { n: "أجزاء", f: 20 } };


  /* ---------------- helpers ---------------- */
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtEn(s) { return esc(s).replace(/\{([^}]+)\}/g, '<span class="en">$1</span>'); }
  function fmtPt(s) {
    var segs = String(s).split(/[؛·]\s*/).map(function (t) { return t.trim(); }).filter(Boolean);
    if (!segs.length) segs = [String(s)];
    return segs.map(function (seg) {
      var html = fmtEn(seg);
      var segEn = extractEn(seg), spk = segEn ? spkBtn(segEn) : "";
      if (/مثال/.test(seg)) {
        html = html.replace(/^(مثال[^:]*:)/, "<b>$1</b>");
        return '<div class="pt-example">💡 ' + html + spk + "</div>";
      }
      return '<div class="pt-line">• ' + html + spk + "</div>";
    }).join("");
  }
  function renderIconList(b) {
    return (b.title ? '<div class="pt-line" style="font-weight:600">• ' + fmtEn(b.title) + "</div>" : "") +
      '<div class="icon-list">' + b.icons.map(function (it) {
        return '<div class="icon-row"><span class="icon-row-e">' + esc(it.e) + '</span><div class="icon-row-b"><b>' +
          (it.en ? '<span class="en">' + esc(it.en) + "</span>" + (it.ar ? " — " + esc(it.ar) : "") : esc(it.ar || "")) +
          "</b>" + (it.en ? spkBtn(it.en) : "") + (it.note ? '<div class="muted" style="margin-block-start:2px">' + fmtEn(it.note) + "</div>" : "") + "</div></div>";
      }).join("") + "</div>";
  }
  function renderCompare(b) {
    return (b.title ? '<div class="pt-line" style="font-weight:600">• ' + fmtEn(b.title) + "</div>" : "") +
      '<div class="cmp-grid">' + b.cols.map(function (col) {
        var colEn = extractEn(col.items.join(". ")) || extractEn(col.title);
        return '<div class="cmp-col"><h4>' + fmtEn(col.title) + (colEn ? spkBtn(colEn) : "") + "</h4><ul>" + col.items.map(function (it) {
          var itEn = extractEn(it); return "<li>" + fmtEn(it) + (itEn ? spkBtn(itEn) : "") + "</li>";
        }).join("") + "</ul></div>";
      }).join("") + "</div>";
  }
  function renderTreeChain(b) {
    return (b.title ? '<div class="pt-line" style="font-weight:600">• ' + fmtEn(b.title) + "</div>" : "") +
      '<div class="tree-chain">' + b.steps.map(function (s, i) {
        var sEn = extractEn(s);
        return (i > 0 ? '<div class="tree-arrow">↓</div>' : "") + '<div class="tree-step">' + fmtEn(s) + (sEn ? spkBtn(sEn) : "") + "</div>";
      }).join("") + "</div>";
  }
  // Phase 12 — 5 new visual pts templates (fact card, microbe/bug card, scenario
  // case, clauses map, timeline), on top of the existing icons/cols/steps ones.
  function renderFactCard(b) {
    var fEn = extractEn(b.fact);
    return '<div class="fact-card"><span class="fact-ic">' + (b.icon || "💡") + '</span><div class="fact-txt">' +
      fmtEn(b.fact) + (fEn ? spkBtn(fEn) : "") + (b.src ? '<div class="muted" style="margin-block-start:3px;font-size:12.5px">' + esc(b.src) + "</div>" : "") +
      "</div></div>";
  }
  function renderBugCard(b) {
    var rows = [
      ["النوع", b.gram], ["المصدر", b.source], ["الأعراض", b.symptoms], ["الوقاية", b.prevent]
    ].filter(function (r) { return r[1]; });
    return '<div class="bug-card"><div class="bug-head"><span class="bug-ic">🦠</span><div><b>' + esc(b.bug) + "</b>" +
      (b.latin ? '<div class="bug-latin">' + esc(b.latin) + "</div>" : "") + "</div></div>" +
      '<div class="bug-rows">' + rows.map(function (r) {
        return '<div class="bug-row"><span class="bug-k">' + esc(r[0]) + "</span><span>" + fmtEn(r[1]) + "</span></div>";
      }).join("") + "</div></div>";
  }
  function renderCaseCard(b) {
    return '<div class="case-card"><div class="case-head">🧩 ' + esc(b.case) + "</div>" +
      '<div class="case-body">' + fmtEn(b.details) + "</div>" +
      (b.q ? '<div class="case-q"><b>سؤال:</b> ' + fmtEn(b.q) + "</div>" : "") +
      (b.a ? '<details class="case-a"><summary>الإجابة</summary><div>' + fmtEn(b.a) + "</div></details>" : "") +
      "</div>";
  }
  function renderClausesMap(b) {
    return (b.title ? '<div class="pt-line" style="font-weight:600">• ' + fmtEn(b.title) + "</div>" : "") +
      '<div class="clauses-map">' + b.clauses.map(function (c) {
        return '<div class="clause-row"><span class="clause-no">' + esc(c.no) + "</span><span>" + fmtEn(c.title) + "</span></div>";
      }).join("") + "</div>";
  }
  function renderTimeline(b) {
    return (b.title ? '<div class="pt-line" style="font-weight:600">• ' + fmtEn(b.title) + "</div>" : "") +
      '<div class="tl-row">' + b.timeline.map(function (e, i) {
        return (i > 0 ? '<span class="tl-sep"></span>' : "") + '<div class="tl-pt"><div class="tl-dot"></div><div class="tl-t">' + esc(e.t) + '</div><div class="tl-l">' + fmtEn(e.label) + "</div></div>";
      }).join("") + "</div>";
  }
  // Plain-text label for a lesson point (string or icons/cols/steps/… object) —
  // used by Phase 9's 🎯-per-point button and by the "اتعلم" screens' plain display.
  function ptPlainText(t) {
    if (!t || typeof t !== "object") return String(t || "").replace(/[{}]/g, "");
    if (t.icons) return (t.title ? t.title + ": " : "") + t.icons.map(function (it) { return (it.en || "") + (it.ar ? " " + it.ar : ""); }).join(" · ");
    if (t.cols) return (t.title ? t.title + ": " : "") + t.cols.map(function (c) { return c.title + " (" + c.items.join(", ") + ")"; }).join(" | ");
    if (t.steps) return (t.title ? t.title + ": " : "") + t.steps.join(" ← ");
    if (t.fact) return t.fact;
    if (t.bug) return t.bug + (t.latin ? " (" + t.latin + ")" : "");
    if (t.case) return t.case + ": " + (t.details || "");
    if (t.clauses) return (t.title ? t.title + ": " : "") + t.clauses.map(function (c) { return c.no + " " + c.title; }).join(" · ");
    if (t.timeline) return (t.title ? t.title + ": " : "") + t.timeline.map(function (e) { return e.t + " " + e.label; }).join(" ← ");
    return "";
  }
  function renderPt(t) {
    if (t && typeof t === "object") {
      if (t.icons) return renderIconList(t);
      if (t.cols) return renderCompare(t);
      if (t.steps) return renderTreeChain(t);
      if (t.fact) return renderFactCard(t);
      if (t.bug) return renderBugCard(t);
      if (t.case) return renderCaseCard(t);
      if (t.clauses) return renderClausesMap(t);
      if (t.timeline) return renderTimeline(t);
    }
    return fmtPt(t);
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function keyOf(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function addDays(key, n) { var p = key.split("-").map(Number); return keyOf(new Date(Date.UTC(p[0], p[1] - 1, p[2] + n))); }
  function nowR() {
    var ms = Date.now(), d = new Date(ms + TZ * 3600e3);
    return { ms: ms, key: keyOf(d), dow: d.getUTCDay(), h: d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600 };
  }
  function dowOf(key) { var p = key.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  function fmtTime(h) {
    var m = Math.round(h * 60), hh = Math.floor(m / 60) % 24, mm = m % 60;
    return '<span class="num">' + (hh % 12 || 12) + ":" + pad(mm) + "</span> " + (hh >= 12 ? "م" : "ص");
  }
  function fmtDur(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }
  var brandMarkN = 0;
  function brandMark(size, tile) {
    brandMarkN++;
    var gid = "bmg" + brandMarkN;
    if (!tile) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true" style="color:var(--teal)"><path d="M 56 22 A 24 24 0 1 0 56 68 A 19 19 0 1 1 56 22 Z" fill="currentColor" transform="translate(0,2)"/></svg>';
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0DA66B"/><stop offset="1" stop-color="#087A4F"/></linearGradient></defs>' +
      '<rect width="100" height="100" rx="22" fill="url(#' + gid + ')"/>' +
      '<path d="M 56 22 A 24 24 0 1 0 56 68 A 19 19 0 1 1 56 22 Z" fill="#FFFFFF" transform="translate(0,2)"/>' +
      '<g fill="#F5B942"><circle cx="30" cy="71" r="2.6"/><circle cx="41" cy="76" r="3"/><circle cx="55" cy="77.5" r="3.4"/><circle cx="69" cy="75" r="2.8"/><circle cx="79" cy="70" r="2.2"/></g></svg>';
  }
  function ico(name) {
    var s = {
      moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21a2 2 0 0 1 2-2h13v2H6"/></svg>',
      cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/></svg>',
      cert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 13.5 7 22l5-3 5 3-2-8.5"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3.5 4 5 4 9a4 4 0 0 1-8 0c0-1.5.6-2.6 1.4-3.5C9.6 9 10 10 11 10c0-3-1-5 1-8zM12 22a7 7 0 0 0 7-7c0-2-.8-3.6-1.8-5 0 3.5-2.4 5.5-5.2 5.5S6.8 13 6.8 10.5C5.6 12 5 13.4 5 15a7 7 0 0 0 7 7z"/></svg>',
      vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
      leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 16-11 0 9-5 16-11 16z"/><path d="M4 20c3-5 7-8 12-12"/></svg>',
      calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="15" x2="12" y2="15.01"/><line x1="16" y1="15" x2="16" y2="15.01"/><line x1="8" y1="19" x2="8" y2="19.01"/><line x1="12" y1="19" x2="12" y2="19.01"/><line x1="16" y1="19" x2="16" y2="19.01"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M8 3h8l1 6 3 3v2H4v-2l3-3z"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3.5v5c0 5-3.4 8.9-8 11.5-4.6-2.6-8-6.5-8-11.5v-5z"/><path d="M9 12l2 2 4-4"/></svg>',
      food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v7a2 2 0 0 0 4 0V2"/><path d="M9 9v13"/><path d="M17 2c-1.7 0-3 2-3 5s1.3 5 3 5v8"/></svg>',
      flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6"/><path d="M10 2v6l-5.5 10A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-2.9L14 8V2"/><path d="M7.5 15h9"/></svg>',
      refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
      gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
    };
    return s[name] || "";
  }
  // Phase 9: speech rate is now a setting (state.settings.speechRate), and a long
  // press on any 🔊 button always speaks slower regardless of that setting.
  var SPEECH_RATES = [{ v: 0.7, lbl: "بطيئة" }, { v: 0.92, lbl: "عادية" }, { v: 1.15, lbl: "سريعة" }];
  function speak(text, slow) {
    try {
      if (!("speechSynthesis" in window) || !text) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var base = (state.settings && state.settings.speechRate) || 0.92;
      u.lang = "en-US"; u.rate = slow ? Math.max(0.4, base * 0.6) : base;
      window.speechSynthesis.speak(u);
    } catch (er) { }
  }
  function spkBtn(text) {
    return '<button class="spk" data-act="speak" data-txt="' + esc(text) + '" aria-label="استمع للنطق (ضغطة طويلة = نطق بطيء)">' + ico("vol") + "</button>";
  }
  // Extracts the {English} segments the course content already marks up (fmtEn's
  // own convention) so Phase 9 can add a 🔊 next to lesson text that doesn't carry
  // its own dedicated en/ar fields (compare columns, tree-chain steps, plain bullets).
  function extractEn(s) {
    var m = String(s).match(/\{([^}]+)\}/g);
    if (!m) return "";
    return m.map(function (x) { return x.slice(1, -1); }).join(". ");
  }


  /* ---------------- daily reminder push notifications ---------------- */
  var VAPID_PUBLIC_KEY = "BLQVA5Z1nDUTLk0hxyPr3-yqd8i_-D0x8GIlaL-I8eXpR7fV2jL7V5suZG1yUeHQi3L-tehs49se-cTNYbqYfgU";
  function pushSupported() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }
  function pushLocalFlag() { try { return localStorage.getItem("masar:push") === "1"; } catch (e) { return false; } }
  function setPushLocalFlag(v) { try { v ? localStorage.setItem("masar:push", "1") : localStorage.removeItem("masar:push"); } catch (e) { } }
  function urlB64ToUint8Array(base64) {
    var pad = "=".repeat((4 - (base64.length % 4)) % 4);
    var b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(b64), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function pushCardHTML() {
    if (!pushSupported()) return "";
    var on = pushLocalFlag();
    return '<div class="card row between" style="align-items:center"><div><h3 style="margin:0 0 2px">🔔 تذكير يومي</h3><p class="muted" style="font-size:13px">' +
      (on ? "مفعّل — هتوصلك كلمة أو جملة إنجليزي كل فترة." : "فعّله عشان توصلك كلمة أو جملة إنجليزي جديدة بانتظام.") + '</p></div>' +
      (on ? '<button class="btn sm alt" data-act="push-off">إيقاف</button>' : '<button class="btn sm" data-act="push-on">تفعيل</button>') + "</div>";
  }
  async function enablePush() {
    if (!pushSupported()) { toast("الإشعارات مش مدعومة على المتصفح ده."); return; }
    if (state.mode !== "supa" || !store.uid) { toast("لازم تكون مسجّل دخول بالرمز السري الأول."); return; }
    try {
      var perm = await Notification.requestPermission();
      if (perm !== "granted") { toast("محتاجين إذن الإشعارات عشان تشتغل الخاصية."); return; }
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) });
      var j = sub.toJSON();
      var r = await store.sb.from("masar_push_subs").upsert({ user_id: store.uid, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
      if (r.error) throw r.error;
      setPushLocalFlag(true); toast("تم تفعيل التذكير اليومي."); render();
    } catch (e) { toast("تعذّر التفعيل: " + (e && e.message ? e.message : "خطأ غير متوقع")); }
  }
  async function disablePush() {
    try {
      if (pushSupported()) {
        var reg = await navigator.serviceWorker.ready;
        var sub = await reg.pushManager.getSubscription();
        if (sub) {
          if (state.mode === "supa" && store.uid) { try { await store.sb.from("masar_push_subs").delete().eq("endpoint", sub.endpoint); } catch (er) { } }
          await sub.unsubscribe();
        }
      }
    } catch (e) { }
    setPushLocalFlag(false); toast("تم إيقاف التذكير اليومي."); render();
  }


  /* ---------------- state ---------------- */
  var today0 = nowR().key;
  var NOTES_SEED_EN = [
    { id: "p-subj", ts: 1700000012000, title: "ضمائر الفاعل (قبل الفعل)", rows: [
      { label: "I", ex: "I know you." }, { label: "You", ex: "You are kind." }, { label: "He", ex: "He is my brother." },
      { label: "She", ex: "She is a teacher." }, { label: "It", ex: "It is a book." }, { label: "We", ex: "We are friends." }, { label: "They", ex: "They are students." }
    ] },
    { id: "p-obj", ts: 1700000011000, title: "ضمائر المفعول (بعد الفعل)", rows: [
      { label: "Me", ex: "She knows me." }, { label: "You", ex: "I know you." }, { label: "Him", ex: "She knows him." },
      { label: "Her", ex: "I know her." }, { label: "It", ex: "I have it." }, { label: "Us", ex: "He knows us." }, { label: "Them", ex: "I know them." }
    ] },
    { id: "p-posadj", ts: 1700000010000, title: "صفات الملكية (قبل الاسم مباشرة)", rows: [
      { label: "My", ex: "This is my car." }, { label: "Your", ex: "This is your book." }, { label: "His", ex: "This is his phone." },
      { label: "Her", ex: "This is her bag." }, { label: "Its", ex: "The cat licked its paw." }, { label: "Our", ex: "This is our house." }, { label: "Their", ex: "This is their school." }
    ] },
    { id: "p-pospron", ts: 1700000009000, title: "ضمائر الملكية (الضمير يقف لوحده)", rows: [
      { label: "Mine", ex: "This book is mine." }, { label: "Yours", ex: "That phone is yours." }, { label: "His", ex: "The car is his." },
      { label: "Hers", ex: "This bag is hers." }, { label: "Ours", ex: "This house is ours." }, { label: "Theirs", ex: "That school is theirs." }
    ] },
    { id: "its-vs-its", ts: 1700000008000, title: "its غير it's", rows: [
      { label: "its (ملكية، من غير فاصلة)", ex: "The cat licked its paw." }, { label: "it's (اختصار it is / it has)", ex: "It's raining." }
    ] },
    { id: "apos-s", ts: 1700000007000, title: "الملكية بـ 's", rows: [
      { label: "اسم مفرد", ex: "Ahmed's book." }, { label: "جمع منتهي بـ s (فاصلة بس)", ex: "the students' books." }, { label: "جمع شاذ (زي المفرد)", ex: "the children's toys." }
    ] },
    { id: "a-an", ts: 1700000006000, title: "a أو an (حسب النطق مش الكتابة)", rows: [
      { label: "قبل صوت متحرك", ex: "an apple, an hour." }, { label: "قبل صوت ساكن", ex: "a car, a university." }
    ] },
    { id: "have-has", ts: 1700000005000, title: "have أو has", rows: [
      { label: "I / you / we / they", ex: "I have a car." }, { label: "he / she / it", ex: "She has a car." }
    ] },
    { id: "do-does", ts: 1700000004000, title: "do أو does (في النفي والسؤال)", rows: [
      { label: "I / you / we / they", ex: "Do you have a car? — I don't know." }, { label: "he / she / it", ex: "Does she have a car? — He doesn't know." }
    ] },
    { id: "much-many", ts: 1700000003000, title: "How many أو How much", rows: [
      { label: "اسم معدود (له جمع)", ex: "How many brothers do you have?" }, { label: "اسم غير معدود (مالوش جمع)", ex: "How much tea do you need?" }
    ] },
    { id: "irr-plural", ts: 1700000002000, title: "جموع شاذة (مش بإضافة s)", rows: [
      { label: "Child", ex: "children" }, { label: "Man", ex: "men" }, { label: "Woman", ex: "women" }, { label: "Foot", ex: "feet" }
    ] },
    { id: "will-going", ts: 1700000001000, title: "will أو going to", rows: [
      { label: "قرار لحظي وقت الكلام", ex: "I will answer it." }, { label: "خطة مرتبة من قبل", ex: "I am going to travel next week." }
    ] }
  ];
  var NOTES_SEED_EN_V3 = [
    { id: "count-uncount", ts: 1700000012000, title: "معدود وغير معدود: a/an أو some", rows: [
      { label: "a/an + معدود مفرد", ex: "I've got an apple." },
      { label: "some + معدود جمع (العدد مش مهم)", ex: "We've got some biscuits." },
      { label: "some + غير معدود (من غير جمع)", ex: "I've got some bread / some milk / some cheese." },
      { label: "الفعل مع غير المعدود بيفضل مفرد", ex: "This cheese is nice." }
    ] },
    { id: "pres-s-rule", ts: 1700000011000, title: "التصريف مع he/she/it: s أو es أو ies", rows: [
      { label: "أغلب الأفعال (+ s)", ex: "He plays football." },
      { label: "تنتهي بـ ch/sh/o/s/x (+ es)", ex: "She watches TV. / He does his homework." },
      { label: "تنتهي بساكن + y (تتحول لـ ies)", ex: "He carries the bag. / She tries hard." },
      { label: "نطق خاص", ex: "does /dʌz/, goes /gəʊz/, has /hæz/" }
    ] },
    { id: "demonstratives", ts: 1700000010000, title: "this / that / these / those", rows: [
      { label: "قريب، مفرد", ex: "This is my book." },
      { label: "بعيد، مفرد", ex: "That is her car." },
      { label: "قريب، جمع", ex: "These are my shoes." },
      { label: "بعيد، جمع", ex: "Those are his gloves." }
    ] }
  ];
  var NOTES_SEED_EN_L1S1 = [
    { id: "greet-meet", ts: 1700000020000, title: "التعارف والتحية (Meeting & Greeting)", rows: [
      { label: "Nice to meet you.", ex: "الرد: Nice to meet you too / You too" },
      { label: "How are you doing? / How's it going?", ex: "الرد: I'm doing great, thanks! / Pretty good, how about you?" },
      { label: "Long time no see!", ex: "بتتقال لما متقابلتش حد من فترة — الرد: I know, it's been ages!" }
    ] },
    { id: "greet-part", ts: 1700000019000, title: "التوديع (Partings)", rows: [
      { label: "Have a nice day! / Have a good one!", ex: "الرد: Thanks, you too!" },
      { label: "See you later! / Catch you later!", ex: "الرد: See ya! / Take care!" },
      { label: "Good night!", ex: "بتتقال بس وقت المغادرة بالليل — الرد: Good night, sleep well!" }
    ] },
    { id: "greet-polite", ts: 1700000018000, title: "عبارات مهذبة يومية", rows: [
      { label: "Thank you so much!", ex: "الرد: You're welcome! / No problem! / Anytime!" },
      { label: "Excuse me", ex: "بتتقال عشان تلفت انتباه حد أو تعدي جنبه" },
      { label: "I'm sorry / My apologies", ex: "الرد: That's totally fine / No worries at all" }
    ] },
    { id: "gram-tobe", ts: 1700000017000, title: "فعل to be: am / is / are", rows: [
      { label: "I → am", ex: "I am a student." },
      { label: "he / she / it → is", ex: "My name is Noura. / She is a teacher." },
      { label: "you / we / they → are", ex: "They are students." }
    ] },
    { id: "vocab-l1s1", ts: 1700000016000, title: "مفردات الدرس (Level 1 - Session 1)", rows: [
      { label: "Student", ex: "طالب" },
      { label: "Introduce / Introduction", ex: "يُقدّم / تقديم" },
      { label: "Meet / Meeting", ex: "يقابل / اجتماع، مقابلة" },
      { label: "With ≠ Without", ex: "مع ≠ من غير" },
      { label: "Big = Large / Huge", ex: "كبير = كبير جدًا / ضخم" },
      { label: "Excited", ex: "متحمّس" },
      { label: "I work as a/an ...", ex: "بتتقال قبل مهنة (an تتستخدم لو المهنة بتبدأ بحرف متحرك)" },
      { label: "Weather", ex: "الطقس" },
      { label: "Greet / Greeting", ex: "يحيّي / تحية" }
    ] }
  ];
  var NOTES_SEED_ISO = [
    { id: "i-corr", ts: 1700000006000, title: "Correction مقابل Corrective Action", rows: [
      { label: "Correction (تصحيح فوري)", ex: "استبدال القطعة المعيبة فورًا للعميل — بيعالج الأثر الظاهر بس." },
      { label: "Corrective action (إجراء تصحيحي)", ex: "تغيير طريقة التحميل في المخزن عشان يمنع تكرار الخدش — بيعالج السبب الجذري." }
    ] },
    { id: "i-risk", ts: 1700000005000, title: "Risk مقابل Opportunity", rows: [
      { label: "Risk (خطر)", ex: "الاعتماد على مورد وحيد لقطع غيار حرجة." },
      { label: "Opportunity (فرصة)", ex: "زيادة الطلب على خدمة التوصيل." }
    ] },
    { id: "i-verval", ts: 1700000004000, title: "Verification مقابل Validation", rows: [
      { label: "Verification (تحقق)", ex: "هل طابقنا المواصفات المكتوبة؟" },
      { label: "Validation (تثبيت)", ex: "هل المنتج بيحقق الغرض فعلاً وقت الاستخدام؟" }
    ] },
    { id: "i-contin", ts: 1700000003000, title: "Continual مقابل Continuous", rows: [
      { label: "Continual (مستمر بفترات متقطعة)", ex: "التحسين بيحصل على شكل خطوات ودورات — ده اللي بيستخدمه المعيار." },
      { label: "Continuous (بلا انقطاع إطلاقًا)", ex: "مفيش توقف خالص — مش ده المقصود في المعيار." }
    ] },
    { id: "i-pdca", ts: 1700000002000, title: "دورة PDCA", rows: [
      { label: "Plan (خطّط)", ex: "حدد الأهداف والخطة." }, { label: "Do (نفّذ)", ex: "نفّذ الخطة فعليًا." },
      { label: "Check (تحقّق)", ex: "قِس وراجع النتائج." }, { label: "Act (حسّن)", ex: "حسّن بناءً على النتائج، وابدأ الدورة تاني." }
    ] },
    { id: "i-clauses", ts: 1700000001000, title: "خريطة بنود المعيار (4 – 10)", rows: [
      { label: "4 — السياق", ex: "فهم المؤسسة، الأطراف المعنية، ونطاق النظام." },
      { label: "5 — القيادة", ex: "التزام الإدارة العليا وسياسة الجودة." },
      { label: "6 — التخطيط", ex: "المخاطر، الفرص، وأهداف الجودة." },
      { label: "7 — الدعم", ex: "الموارد، الكفاءة، الوعي، المعلومات الموثقة." },
      { label: "8 — التشغيل", ex: "تنفيذ العمليات وضبط المخرجات غير المطابقة." },
      { label: "9 — تقييم الأداء", ex: "المراقبة، التدقيق الداخلي، مراجعة الإدارة." },
      { label: "10 — التحسين", ex: "معالجة عدم المطابقة والتحسين المستمر." }
    ] }
  ];
  var NOTES_SEED_ISO14001 = [
    { id: "e-corr", ts: 1700000006000, title: "Correction مقابل Corrective Action", rows: [
      { label: "Correction (تصحيح فوري)", ex: "تنظيف تسرب الديزل فورًا — بيعالج الأثر الظاهر بس." },
      { label: "Corrective action (إجراء تصحيحي)", ex: "تحديث جدول صيانة الخزانات بعد اكتشاف صمام تالف — بيعالج السبب الجذري." }
    ] },
    { id: "e-risk", ts: 1700000005000, title: "Risk مقابل Opportunity", rows: [
      { label: "Risk (خطر)", ex: "الاعتماد الكلي على مصدر مياه واحد في منطقة جفاف موسمي." },
      { label: "Opportunity (فرصة)", ex: "تطوير عبوات قابلة لإعادة التدوير استجابةً لوعي العملاء البيئي." }
    ] },
    { id: "e-aspimp", ts: 1700000004000, title: "Aspect مقابل Impact (الجانب والتأثير البيئي)", rows: [
      { label: "Aspect (جانب بيئي — السبب)", ex: "انبعاثات شاحنات نقل المواد الخام." },
      { label: "Impact (تأثير بيئي — النتيجة)", ex: "تلوث الهواء الناتج عن الانبعاثات." }
    ] },
    { id: "e-hoc", ts: 1700000003000, title: "التسلسل الهرمي للضبط (Hierarchy of Controls)", rows: [
      { label: "1) إلغاء المصدر", ex: "أقوى وسيلة ضبط — تشيل الخطر من الأساس." },
      { label: "2) الإحلال", ex: "تستبدل بمادة أو طريقة أقل ضررًا." },
      { label: "3) ضوابط هندسية", ex: "تعديل المعدات أو العملية نفسها." },
      { label: "4) ضوابط إدارية", ex: "إجراءات وتدريب وتعليمات عمل." },
      { label: "5) معدات الحماية الشخصية", ex: "آخر خط دفاع — PPE." }
    ] },
    { id: "e-pdca", ts: 1700000002000, title: "دورة PDCA", rows: [
      { label: "Plan (خطّط)", ex: "حدد الأهداف والخطة." }, { label: "Do (نفّذ)", ex: "نفّذ الخطة فعليًا." },
      { label: "Check (تحقّق)", ex: "قِس وراجع النتائج." }, { label: "Act (حسّن)", ex: "حسّن بناءً على النتائج، وابدأ الدورة تاني." }
    ] },
    { id: "e-clauses", ts: 1700000001000, title: "خريطة بنود المعيار (4 – 10)", rows: [
      { label: "4 — السياق", ex: "فهم المؤسسة، الأطراف المعنية، ونطاق النظام البيئي." },
      { label: "5 — القيادة", ex: "التزام الإدارة العليا والسياسة البيئية." },
      { label: "6 — التخطيط", ex: "الجوانب والتأثيرات البيئية، الالتزامات القانونية، الأهداف." },
      { label: "7 — الدعم", ex: "الموارد، الكفاءة، الوعي، المعلومات الموثقة." },
      { label: "8 — التشغيل والطوارئ", ex: "ضبط العمليات والاستعداد والاستجابة للطوارئ." },
      { label: "9 — تقييم الأداء", ex: "المراقبة، تقييم الامتثال، التدقيق، مراجعة الإدارة." },
      { label: "10 — التحسين", ex: "معالجة عدم المطابقة والتحسين المستمر." }
    ] }
  ];
  var NOTES_SEED_ISO45001 = [
    { id: "s-incident", ts: 1700000006000, title: "Correction مقابل Corrective Action (سلامة)", rows: [
      { label: "Correction (تصحيح فوري)", ex: "تجفيف أرضية مبللة ووضع لافتة تحذير مؤقتة — بيعالج الموقف فورًا بس." },
      { label: "Corrective action (إجراء تصحيحي)", ex: "تركيب أرضية مانعة للانزلاق بعد التحقيق في السبب — بيعالج السبب الجذري." }
    ] },
    { id: "s-nearmiss", ts: 1700000005000, title: "Incident و Near-miss", rows: [
      { label: "Incident (حادث)", ex: "واقعة أدت أو كان ممكن تؤدي لإصابة." },
      { label: "Near-miss (إنذار مبكر)", ex: "عامل انزلق ولم يُصب — نوع من الحادث بدون إصابة فعلية." }
    ] },
    { id: "s-hoc", ts: 1700000004000, title: "التسلسل الهرمي للضبط (سلامة)", rows: [
      { label: "1) الإلغاء", ex: "إزالة الخطر نهائيًا من مصدره." },
      { label: "2) الإحلال", ex: "استبدال بمادة أو عملية أقل خطورة." },
      { label: "3) ضوابط هندسية", ex: "حواجز وأنظمة تهوية وعزل صوتي." },
      { label: "4) ضوابط إدارية", ex: "لوحات تحذير وإجراءات عمل آمنة وتدريب." },
      { label: "5) معدات الحماية الشخصية (PPE)", ex: "آخر خط دفاع — سدادات أذن، خوذة، قفازات." }
    ] },
    { id: "s-consult", ts: 1700000003000, title: "Consultation مقابل Participation", rows: [
      { label: "Consultation (مشاورة)", ex: "أخذ رأي العامل قبل اتخاذ القرار." },
      { label: "Participation (مشاركة)", ex: "لجنة سلامة مشتركة تتخذ قرارات تنفيذية فعلية." }
    ] },
    { id: "s-clauses", ts: 1700000002000, title: "خريطة بنود المعيار (4 – 10)", rows: [
      { label: "4 — السياق", ex: "فهم المؤسسة، العاملين، والأطراف المعنية، ونطاق النظام." },
      { label: "5 — القيادة ومشاركة العاملين", ex: "التزام الإدارة العليا، سياسة السلامة، مشاورة ومشاركة العاملين." },
      { label: "6 — التخطيط", ex: "تحديد الأخطار، تقييم المخاطر والفرص، أهداف السلامة." },
      { label: "7 — الدعم", ex: "الموارد، الكفاءة، الوعي، PPE، المعلومات الموثقة." },
      { label: "8 — التشغيل والطوارئ", ex: "التسلسل الهرمي للضبط، إدارة التغيير، الاستعداد للطوارئ." },
      { label: "9 — تقييم الأداء", ex: "المراقبة، تقييم الامتثال، التدقيق، مراجعة الإدارة." },
      { label: "10 — التحسين", ex: "الحادث وعدم المطابقة والإجراء التصحيحي، التحسين المستمر." }
    ] }
  ];
  var NOTES_SEED_ISO22000 = [
    { id: "s-ccp-oprp", ts: 1700000010000, title: "CCP مقابل OPRP", rows: [
      { label: "CCP (نقطة تحكم حرجة)", ex: "حد حرج رقمي قابل للقياس مباشرة، مثل درجة حرارة البسترة." },
      { label: "OPRP (برنامج تشغيلي تمهيدي)", ex: "معيار إجراء قد يكون ملحوظًا، مثل فحص بصري لنظافة سطح العمل." }
    ] },
    { id: "s-correction22", ts: 1700000009000, title: "Correction مقابل Corrective Action (غذاء)", rows: [
      { label: "Correction (تصحيح فوري)", ex: "حجز وتقييم دفعة منتج متأثرة فورًا — بيعالج الموقف الظاهر." },
      { label: "Corrective action (إجراء تصحيحي)", ex: "إصلاح الصمام وتعديل إجراء التنظيف بعد التحقيق — بيعالج السبب الجذري." }
    ] },
    { id: "s-unsafe-recall", ts: 1700000008000, title: "منتج محتمل عدم أمانه مقابل السحب", rows: [
      { label: "Potentially unsafe product", ex: "المنتج لسه تحت سيطرة المؤسسة — يُحتجز ويُقيَّم." },
      { label: "Withdrawal/Recall", ex: "المنتج خرج فعلًا من السيطرة ووصل للسوق — سحب فوري وتبليغ." }
    ] },
    { id: "s-prp-haccp", ts: 1700000007000, title: "PRPs مقابل خطة ضبط الأخطار", rows: [
      { label: "PRPs (برامج تمهيدية)", ex: "أساسيات عامة مستمرة: نظافة، مكافحة آفات، اعتماد موردين." },
      { label: "Hazard control plan (HACCP/OPRP)", ex: "خطة محددة لكل CCP/OPRP بحد حرج أو معيار إجراء ومراقبة وتصحيح." }
    ] },
    { id: "s-clauses22", ts: 1700000006000, title: "خريطة بنود المعيار (4 – 10)", rows: [
      { label: "4 — السياق", ex: "فهم المؤسسة، سلسلة الغذاء، والأطراف المعنية، ونطاق النظام." },
      { label: "5 — القيادة وفريق سلامة الغذاء", ex: "التزام الإدارة العليا، سياسة سلامة الغذاء، تعيين فريق سلامة الغذاء وقائده." },
      { label: "6 — التخطيط", ex: "مخاطر وفرص أداء النظام، أهداف سلامة الغذاء، تخطيط التغييرات." },
      { label: "7 — الدعم", ex: "الموارد، العناصر المطوَّرة خارجيًا، الكفاءة، الوعي، المعلومات الموثقة." },
      { label: "8 — التشغيل", ex: "PRPs، التتبع، الطوارئ، تحليل الأخطار، CCP/OPRP، التعامل مع المنتجات غير الآمنة والسحب." },
      { label: "9 — تقييم الأداء", ex: "المراقبة، التدقيق الداخلي، مراجعة الإدارة." },
      { label: "10 — التحسين", ex: "عدم المطابقة والإجراء التصحيحي، التحسين المستمر، تحديث النظام." }
    ] }
  ];
  var NOTES_SEED_ISO17025 = [
    { id: "s-optionab", ts: 1700000015000, title: "الخيار A مقابل الخيار B", rows: [
      { label: "Option A", ex: "المعمل يبني نظام إدارة كامل مستقل يغطي بنود 8.2-8.9." },
      { label: "Option B", ex: "المعمل يستخدم شهادة آيزو 9001 سارية تغطي نفس الأنشطة." }
    ] },
    { id: "s-verval17025", ts: 1700000014000, title: "Verification مقابل Validation (معامل)", rows: [
      { label: "Verification (تحقق)", ex: "إثبات إن المعمل قادر يطبّق طريقة قياسية صح قبل استخدامها." },
      { label: "Validation (تصديق)", ex: "إثبات ملاءمة طريقة غير قياسية أو معدَّلة أو خارج نطاقها المعتاد." }
    ] },
    { id: "s-impconf", ts: 1700000013000, title: "Impartiality مقابل Confidentiality", rows: [
      { label: "Impartiality (نزاهة)", ex: "حياد تام وعدم تأثر بضغوط تجارية أو مالية أو علاقات ملكية." },
      { label: "Confidentiality (سرية)", ex: "حماية كل المعلومات اللي تم الحصول عليها أو إنشاؤها أثناء العمل." }
    ] },
    { id: "s-report17025", ts: 1700000012000, title: "تقرير اختبار مقابل شهادة معايرة", rows: [
      { label: "Test report", ex: "نتائج اختبار، ممكن يشمل بيان مطابقة أو آراء وتفسيرات." },
      { label: "Calibration certificate", ex: "عدم يقين القياس إجباري، ممنوع توصية بفترة المعايرة القادمة." }
    ] },
    { id: "s-clauses17025", ts: 1700000011000, title: "خريطة بنود المعيار (4 – 8)", rows: [
      { label: "4 — المتطلبات العامة", ex: "النزاهة والسرية." },
      { label: "5 — المتطلبات الهيكلية", ex: "الكيان القانوني، الإدارة، نطاق الأنشطة، الهيكل التنظيمي." },
      { label: "6 — متطلبات الموارد", ex: "الأفراد، المرافق، المعدات، التتبع المتري، المنتجات الخارجية." },
      { label: "7 — متطلبات العملية", ex: "العقود، الطرق، أخذ العينات، السجلات، عدم اليقين، التقارير، الشكاوى." },
      { label: "8 — نظام الإدارة", ex: "الخيار A أو B: الوثائق، السجلات، المخاطر، التحسين، التدقيق، المراجعة." }
    ] }
  ];
  var NOTES_SEED_MICRO = [
    { id: "s-micro-numbers", ts: 1700000020000, title: "أرقام النمو والقتل الحراري", rows: [
      { label: "زمن الجيل", ex: "g = t/n، وE. coli في الظروف المثالية حوالي 20 دقيقة." },
      { label: "D-value / z-value", ex: "D = زمن خفض 90% عند حرارة ثابتة؛ z = تغيّر الحرارة اللازم لتغيّر D عشر مرات." },
      { label: "Listeria 6D", ex: "حوالي 2.0 دقيقة عند 70°م (z=7.5°م)." },
      { label: "C. botulinum non-proteolytic 6D", ex: "حوالي 10 دقائق عند 90°م (z=10°م)." },
      { label: "pH 4.6 وaw", ex: "حد تصنيف Low-acid؛ S. aureus ينمو لحد aw=0.83 ويُكوّن سم لحد aw=0.85." }
    ] },
    { id: "s-micro-labmethods", ts: 1700000019000, title: "طرق معملية سريعة (أرقام تتحفظ)", rows: [
      { label: "APC حسب BAM", ex: "PCA، حضانة 35°م حوالي 48 ساعة، أطباق مقبولة 25-250 مستعمرة." },
      { label: "MPN في E. coli", ex: "EC broth في حمام مائي عند 44.5°م ± 0.2°م." },
      { label: "Molds & Yeasts", ex: "DRBC أو DG18، 25°م، 5 أيام، أطباق 10-150." },
      { label: "Coliforms (تعريف BAM)", ex: "Gram-negative عصوية لا هوائية اختيارية تخمّر اللاكتوز بغاز وحمض خلال 48 ساعة عند 35°م." }
    ] },
    { id: "s-micro-detection", ts: 1700000018000, title: "تسلسل الكشف عن الممرضات", rows: [
      { label: "Salmonella", ex: "Pre-enrichment (BPW) ← Selective enrichment (MKTTn/RVS) ← Selective plating (XLD/HE/BS) ← Confirmation (Serology+TSI/LIA)." },
      { label: "Listeria", ex: "BLEB ← Oxford/PALCAM/Chromogenic ← Hemolysis + CAMP + PCR." },
      { label: "صبغة جرام", ex: "Crystal violet ← Iodine ← Decolorizer ← Safranin؛ Gram+ بنفسجي، Gram- وردي." }
    ] }
  ];
  var NOTES_SEED_BY_COURSE = { en: NOTES_SEED_EN, iso: NOTES_SEED_ISO, iso14001: NOTES_SEED_ISO14001, iso45001: NOTES_SEED_ISO45001, iso22000: NOTES_SEED_ISO22000, iso17025: NOTES_SEED_ISO17025, micro: NOTES_SEED_MICRO };
  function freshDraft() { return { title: "", rows: [{ label: "", ex: "" }, { label: "", ex: "" }] }; }
  function captureDraft() {
    var d = state.ndraft; if (!d) return;
    var t = $("#ndTitle"); if (t) d.title = t.value;
    d.rows.forEach(function (r, i) {
      var l = $("#ndLabel" + i), e = $("#ndEx" + i);
      if (l) r.label = l.value;
      if (e) r.ex = e.value;
    });
  }
  function seedNotesCourse(cid, seedArr) {
    if (!state.learn.notes[cid]) state.learn.notes[cid] = [];
    var have = {}; state.learn.notes[cid].forEach(function (n) { have[n.id] = true; });
    seedArr.forEach(function (n) { if (!have[n.id]) state.learn.notes[cid].push(n); });
  }
  var NOTES_SEED_VERSION = 8;
  function ensureNotesSeed() {
    var v = state.learn.notesSeeded || 0;
    if (v >= NOTES_SEED_VERSION) return;
    if (v < 1) seedNotesCourse("en", NOTES_SEED_EN);
    if (v < 2) { seedNotesCourse("iso", NOTES_SEED_ISO); seedNotesCourse("iso14001", NOTES_SEED_ISO14001); }
    if (v < 3) seedNotesCourse("en", NOTES_SEED_EN_V3);
    if (v < 4) seedNotesCourse("iso45001", NOTES_SEED_ISO45001);
    if (v < 5) seedNotesCourse("iso22000", NOTES_SEED_ISO22000);
    if (v < 6) seedNotesCourse("iso17025", NOTES_SEED_ISO17025);
    if (v < 7) seedNotesCourse("en", NOTES_SEED_EN_L1S1);
    if (v < 8) seedNotesCourse("micro", NOTES_SEED_MICRO);
    state.learn.notesSeeded = NOTES_SEED_VERSION; saveMeta("learn", 0);
  }
  // minutes: {dateKey: wholeMinutes} — real elapsed time spent with the "تعلّم" tab
  // open and the tab/page visible, accumulated by tick() below. Powers the admin
  // dashboard's weekly-minutes KPI and the per-account "هدف الدقايق" goal (Phase 6).
  function freshLearn() { return { xp: 0, units: {}, cards: {}, mistakes: {}, study: {}, badges: {}, daily: null, notes: {}, notesSeeded: 0, exam: {}, resume: null, minutes: {}, srsVersion: 1, srsDaily: null, weak: {}, mySentences: [] }; }
  var state = {
    loaded: false, mode: "local",
    settings: { startDate: today0, unit: "page", amount: 5, startPage: 1, certName: "" },
    days: {},
    learn: freshLearn(),
    exp: { categories: [], items: [], salary: {}, budgets: {}, recurring: [] },
    expMonth: null, expAdd: false, expCat: "", expNewCat: false, expSalEdit: false,
    expKind: "expense", expEditId: null, expBudgetEditCat: null, expRecurAdd: false, expSwipeId: null,
    tab: "home", hv: "dashboard", pv: "today", archiveN: 30, lv: { mode: "courses" }, quiz: null, card: null, spk: null,
    wd: null, weakTab: "all",
    az: null, azProgress: {}, azOpen: {}, settingsOpen: false,
    // Default to every section allowed until an account's real permissions are known
    // (applyPermissions() narrows this on login) — matches TOGGLEABLE_SECTIONS below.
    allowedSections: ["prayer", "quran", "learn", "exp"],
    dailyGoalMin: 0, dailyNewWordLimit: 0
  };
  var ready = { days: false, settings: false, learn: false, exp: false };


  /* ---------------- storage ---------------- */
  var CFG = {
    url: "https://guorxzejmtvypiwxrogf.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1b3J4emVqbXR2eXBpd3hyb2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzI2NjksImV4cCI6MjEwNTMwODY2OX0.o95p3N83NLU8ZKZG5LtwS95iR1W3eN03qixqjsnWk_8",
    prefix: "masar-"
  };
  // All accounts the lock screen accepts. Fetched from masar_accounts (readable by
  // anyone with the anon key) on boot, so the admin can add a new account from the
  // dashboard without any code change or redeploy. Unlock tries each account's
  // email with the typed PIN as the password, in order, and signs in to whichever
  // one accepts it. A fixed fallback list is used only if that table can't be
  // reached (e.g. before it's created), so the app still works meanwhile.
  var ACCOUNTS = [];
  var ACCOUNTS_FALLBACK = [
    { email: "masar-user@example.com", uid: "6190722f-b2ef-4003-8472-3a344bc0a32a", role: "user", label: "الحساب الأساسي", active: true },
    { email: "masar-user2@example.com", uid: "6ce60dd2-5adc-4182-94d7-8a39b61815c2", role: "user", label: "الحساب الثانوي", active: true },
    { email: "masar-admin@example.com", uid: "bd940509-27b2-4d6d-ab7c-4911a09e803a", role: "admin", label: "الأدمن", active: true }
  ];
  async function loadAccountsList() {
    try {
      // courses/sections are optional columns (added for per-account permissions).
      // Try the richer select first; if the columns don't exist yet in this
      // project (migration not run), fall back to the plain select so accounts
      // still load normally — courses/sections just come back undefined, which
      // every permission check below treats as "see everything".
      // daily_goal_min/daily_new_word_limit are newer optional columns (per-account
      // learning goal, set from the admin "الصلاحيات" tab) — same progressive-select
      // fallback as courses/sections above, so accounts still load before that
      // migration is run.
      var r = await store.sb.from("masar_accounts").select("uid,email,role,label,active,courses,sections,daily_goal_min,daily_new_word_limit");
      if (r.error) r = await store.sb.from("masar_accounts").select("uid,email,role,label,active,courses,sections");
      if (r.error) r = await store.sb.from("masar_accounts").select("uid,email,role,label,active");
      if (!r.error && r.data && r.data.length) {
        ACCOUNTS = r.data.map(function (row) {
          return { email: row.email, uid: row.uid, role: row.role, label: row.label, active: row.active !== false, courses: row.courses || null, sections: row.sections || null, dailyGoalMin: row.daily_goal_min || 0, dailyNewWordLimit: row.daily_new_word_limit || 0 };
        });
        return;
      }
    } catch (e) { }
    ACCOUNTS = ACCOUNTS_FALLBACK;
  }
  var store = { sb: null, uid: null };
  var LSKEY = "masar:v1";
  function localSave() {
    try { localStorage.setItem(LSKEY, JSON.stringify({ settings: state.settings, days: state.days, learn: state.learn, exp: state.exp })); } catch (e) { }
  }
  function localLoad() {
    try {
      var raw = localStorage.getItem(LSKEY); if (!raw) return;
      var o = JSON.parse(raw);
      if (o.settings) Object.assign(state.settings, o.settings);
      if (o.days) state.days = o.days;
      if (o.learn) Object.assign(state.learn, o.learn);
      if (o.exp) Object.assign(state.exp, o.exp);
    } catch (e) { }
  }
  var timers = {}, dirty = {}, chains = {};
  function persist(id, delay, write) {
    dirty[id] = true;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function () {
      timers[id] = null;
      chains[id] = (chains[id] || Promise.resolve()).then(write).catch(function () {
        toast("تعذّر الحفظ. تأكد من الاتصال وحاول مرة أخرى.");
      }).then(function () { if (!timers[id]) dirty[id] = false; });
    }, delay);
  }
  function supaCheck(r) { if (r && r.error) throw r.error; }
  function saveDay(key, delay) {
    if (state.mode === "supa") {
      persist("day:" + key, delay || 0, function () {
        return store.sb.from("masar_days").upsert({ user_id: store.uid, day: key, data: state.days[key] || {}, updated_at: new Date().toISOString() }, { onConflict: "user_id,day" }).then(supaCheck);
      });
      return;
    }
    localSave();
  }
  function metaData(name) { return name === "settings" ? state.settings : name === "exp" ? state.exp : state.learn; }
  function saveMeta(name, delay) {
    if (state.mode === "supa") {
      persist("meta:" + name, delay || 0, function () {
        return store.sb.from("masar_meta").upsert({ user_id: store.uid, name: name, data: metaData(name), updated_at: new Date().toISOString() }, { onConflict: "user_id,name" }).then(supaCheck);
      });
      return;
    }
    localSave();
  }
  function checkLoaded() {
    if (!state.loaded && ready.days && ready.settings && ready.learn && ready.exp) {
      state.loaded = true; ensureNotesSeed(); maybeUseStreakFreeze(nowR()); render();
    }
  }
  // The Supabase SDK is loaded via a <script defer> tag in <head>, so it downloads in
  // parallel with the rest of the page instead of blocking first paint; window.supabase
  // is usually ready by the time initStore() runs. On a flaky connection that script can
  // occasionally still be missing (or fail outright); retry it once with a fresh request
  // before giving up on cloud sync for this session (otherwise the app would silently
  // fall back to an empty local-only account even though the person has a real cloud account).
  function loadSupabaseScript() {
    return new Promise(function (resolve) {
      if (window.supabase) { resolve(true); return; }
      var done = false, finish = function (ok) { if (done) return; done = true; resolve(ok); };
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";
      s.onload = function () { finish(!!window.supabase); };
      s.onerror = function () { finish(false); };
      document.head.appendChild(s);
      setTimeout(function () { finish(!!window.supabase); }, 6000);
    });
  }
  async function initStore() {
    if (!window.supabase) await loadSupabaseScript();
    if (window.supabase && CFG.url && CFG.key) { initSupa(); return; }
    state.mode = "local"; localLoad(); ensureNotesSeed();
    migrateSrsV2(nowR()); // fire-and-forget; see its own comment
    ready.days = ready.settings = ready.learn = ready.exp = true; checkLoaded(); render();
    var lockEl = document.getElementById("lock"); if (lockEl) lockEl.hidden = true;
  }


  /* ---------------- toast ---------------- */
  var toastT;
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("on");
    clearTimeout(toastT); clearTimeout(undoT); undoPending = null;
    toastT = setTimeout(function () { el.classList.remove("on"); }, 2600);
  }
  // A toast with a 5-second window to reverse the action it's reporting (used by the
  // expense delete flow) — restoreFn is called once, either by tapping "تراجع" or never,
  // and the toast reverts to plain toast() behavior the next time either is used.
  var undoT, undoPending = null;
  function undoToast(msg, restoreFn) {
    undoPending = restoreFn;
    var el = $("#toast");
    el.innerHTML = esc(msg) + ' <button type="button" data-act="exp-undo" style="margin-inline-start:10px;text-decoration:underline;background:none;border:0;color:inherit;font-weight:700;cursor:pointer;min-height:0">تراجع</button>';
    el.classList.add("on");
    clearTimeout(toastT); clearTimeout(undoT);
    undoT = setTimeout(function () { el.classList.remove("on"); undoPending = null; }, 5000);
  }


  /* ---------------- views ---------------- */
  function head() { return ""; }
  function bannerHTML() {
    return state.mode === "local" ? '<div class="banner">الحفظ السحابي غير متاح في هذا العرض. بياناتك تُحفظ على هذا المتصفح فقط.</div>' : "";
  }
  function weekBars(now) {
    var out = "";
    for (var i = 6; i >= 0; i--) {
      var k = addDays(now.key, -i), n = 0;
      for (var j = 0; j < 5; j++) if (isDone(status(k, j, now))) n++;
      out += '<div><span class="col"><i class="' + (n === 5 ? "full" : "") + '" style="height:' + Math.round(n / 5 * 100) + '%"></i></span><b class="num" style="font-weight:500">' + n + "</b><span>" + WD_S[dowOf(k)] + "</span></div>";
    }
    return out;
  }

  function weeklyStats(now) {
    var doneP = 0, totalPray = 0, fullDays = 0, missedP = 0, pages = 0, xp = 0;
    for (var i = 6; i >= 0; i--) {
      var k = addDays(now.key, -i), n = 0, miss = 0;
      for (var j = 0; j < 5; j++) { var st = status(k, j, now); if (isDone(st)) n++; if (st === "missed") miss++; }
      doneP += n; totalPray += 5; missedP += miss; if (n === 5) fullDays++;
      pages += pagesOn(k);
      xp += (state.learn.study[k] || 0);
    }
    var t = target(), weeklyTarget = t * 7;
    return { doneP: doneP, totalPray: totalPray, fullDays: fullDays, missedP: missedP, pages: pages, weeklyTarget: weeklyTarget, xp: xp, pct: totalPray ? Math.round(doneP / totalPray * 100) : 0 };
  }
  function weeklyMsg(pct) {
    if (pct >= 95) return "أسبوع ممتاز ما شاء الله 🌟";
    if (pct >= 75) return "أسبوع جيد جدًا، كمّل كده";
    if (pct >= 50) return "أسبوع لا بأس به، فيه مجال تتحسّن";
    return "حاول تركّز أكتر الأسبوع الجاي";
  }
  function weeklyReportHTML(now) {
    var s = weeklyStats(now);
    var startK = addDays(now.key, -6);
    var rangeLbl = startK.slice(8) + "/" + startK.slice(5, 7) + " - " + now.key.slice(8) + "/" + now.key.slice(5, 7);
    return '<button class="linkbtn" data-act="weekly-close">← رجوع</button>' +
      '<div class="card"><div class="row between"><h2 style="margin:0">تقرير الأسبوع</h2><span class="chip">' + rangeLbl + "</span></div>" +
      '<p class="muted" style="font-size:14px;margin-block-start:6px">' + weeklyMsg(s.pct) + "</p></div>" +
      '<div class="card"><h3>الصلاة</h3>' +
      '<div class="row between" style="margin-block-end:6px"><span class="muted">' + s.doneP + " من " + s.totalPray + " صلاة (" + s.pct + "%)</span><span class=\"chip\">" + s.fullDays + " أيام كاملة</span></div>" +
      '<div class="bar"><i style="width:' + s.pct + '%"></i></div>' +
      (s.missedP ? '<p class="muted" style="font-size:13px;margin-block-start:8px">فاتتك ' + s.missedP + (s.missedP === 1 ? " صلاة" : " صلوات") + " الأسبوع ده</p>" : "") +
      '<div class="card" style="margin:14px 0 0;background:var(--surface2);border:0"><div class="week">' + weekBars(now) + "</div></div></div>" +
      '<div class="card"><h3>القرآن</h3><div class="row between"><span class="muted">' + s.pages + " من " + s.weeklyTarget + " صفحة مستهدفة</span><span class=\"chip\">" + Math.round(s.pages / 7 * 10) / 10 + " صفحة/يوم</span></div>" +
      '<div class="bar amber" style="margin-block-start:8px"><i style="width:' + Math.min(100, Math.round(s.pages / s.weeklyTarget * 100)) + '%"></i></div></div>' +
      '<div class="card"><h3>التعلّم</h3><div class="row between"><span class="muted">نقاط اكتسبتها الأسبوع ده</span><span class="chip num">+' + s.xp + "</span></div></div>" +
      weeklyChallengeCardHTML(now);
  }
  // Phase 11 — weekly-challenge card shown inside the weekly report.
  function weeklyChallengeCardHTML(now) {
    var w = currentWeeklyChallenge(now);
    if (w && w.done) {
      return '<div class="card"><h3>🏆 تحدي الأسبوع</h3><p class="muted" style="margin-block-start:6px">خلّصته بنتيجة <span class="num">' + w.score + '%</span>. تحدي جديد يوم السبت الجاي.</p></div>';
    }
    return '<div class="card"><h3>🏆 تحدي الأسبوع</h3><p class="muted" style="margin-block-start:6px">10 أسئلة من كل اللي تعلّمته، بمكافأة نقاط إضافية — متاح لحد ما تحاوله.</p><button class="btn alt" data-act="weekly-challenge-start" style="margin-block-start:8px">ابدأ التحدي</button></div>';
  }
  function ringSVG(sts) {
    var r = 58, C = 2 * Math.PI * r, gap = 9, seg = C / 5 - gap, s = '<svg viewBox="0 0 140 140" class="ring" aria-hidden="true">';
    sts.forEach(function (st, i) {
      var cls = st === "done" || st === "qada" ? "done" : (st === "late" ? "late" : (st === "current" ? "current" : (st === "missed" ? "missed" : "")));
      s += '<circle class="seg ' + cls + '" cx="70" cy="70" r="' + r + '" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + seg.toFixed(2) + " " + (C - seg).toFixed(2) + '" transform="rotate(' + (-90 + i * 72 + (gap / 2) / C * 360).toFixed(2) + ' 70 70)"/>';
    });
    return s + "</svg>";
  }

  function heroHTML(now) {
    var key = now.key, sts = PRAYERS.map(function (p, i) { return status(key, i, now); });
    var doneN = sts.filter(isDone).length, cur = -1, i;
    for (i = 0; i < 5; i++) if (sts[i] === "current") { cur = i; break; }
    var lbl, nm, sub, target;
    if (cur >= 0) {
      var w = windowOf(key, cur); lbl = "الآن وقت"; nm = pname(key, cur); target = w.end; sub = "ينتهي وقتها بعد";
    } else {
      var nx = -1, tk = key;
      for (i = 0; i < 5; i++) if (sched(key).times[i] > now.h) { nx = i; break; }
      if (nx < 0) { nx = 0; tk = addDays(key, 1); }
      lbl = "الصلاة القادمة"; nm = pname(tk, nx); target = sched(tk).times[nx] + (tk === key ? 0 : 24); sub = "بعد";
    }
    return '<div class="card"><div class="hero"><div class="ringbox">' + ringSVG(sts) +
      '<div class="ringtxt"><b class="num">' + doneN + '/5</b><span>صلوات اليوم</span></div></div>' +
      '<div class="next grow"><div class="lbl">' + lbl + '</div><div class="nm">' + esc(nm) + '</div>' +
      '<div class="sub">' + sub + ' <span class="cd num" id="cd" data-t="' + target + '">' + fmtDur((target - now.h) * 3600) + '</span></div></div></div></div>';
  }

  function alertHTML(now) {
    if (!state.loaded) return "";
    var list = missedList(now);
    if (!list.length) return "";
    var shown = list.slice(-6).reverse();
    var items = shown.map(function (m) {
      var lbl = m.key === now.key ? "اليوم" : WD[dowOf(m.key)] + " " + m.key.slice(8) + "/" + m.key.slice(5, 7);
      return '<div class="miss-item"><span>' + esc(pname(m.key, m.i)) + " · " + esc(lbl) + '</span><button class="btn sm" data-act="tp" data-d="' + m.key + '" data-p="' + m.i + '">قضيتها</button></div>';
    }).join("");
    var more = list.length > shown.length ? '<p class="muted" style="margin-block-start:8px;font-size:14px">و ' + (list.length - shown.length) + ' أخرى في <button class="linkbtn" data-act="tab" data-t="archive">الأرشيف</button></p>' : "";
    return '<div class="card alert"><h2>فاتتك ' + list.length + (list.length > 10 ? " صلاة" : (list.length === 1 ? " صلاة" : " صلوات")) + '</h2><p style="font-size:14px">سجّل القضاء بعد ما تصلّيها.</p><div class="miss-list">' + items + "</div>" + more + "</div>";
  }

  function prayersHTML(now) {
    var key = now.key;
    return PRAYERS.map(function (p, i) {
      var st = status(key, i, now), w = windowOf(key, i), r = rec(key, i), label, sub;
      if (st === "upcoming") label = "لم يحن وقتها";
      else if (st === "current") label = "سجّلت الصلاة";
      else if (st === "done") label = "✓ تمت";
      else if (st === "late") label = "✓ بعد الوقت";
      else if (st === "qada") label = "✓ قضاء";
      else label = "فاتت · سجّل قضاء";
      sub = "من " + fmtTime(w.start) + " إلى " + fmtTime(w.end % 24);
      if (r && r.t) { var lt = new Date(r.t + TZ * 3600e3); sub = "سُجّلت " + fmtTime(lt.getUTCHours() + lt.getUTCMinutes() / 60); }
      return '<div class="prow st-' + st + '"><div class="pn">' + esc(pname(key, i)) + ' <span style="font-size:16px;color:var(--muted);font-family:var(--body);font-weight:400">' + fmtTime(w.start) + '</span></div><div class="pt">' + sub + '</div>' +
        '<button class="pbtn" data-act="tp" data-d="' + key + '" data-p="' + i + '"' + (st === "upcoming" ? " disabled" : "") + ">" + label + "</button></div>";
    }).join("");
  }

  function quranMini(now) {
    var t = target(), n = pagesOn(now.key), pct = Math.min(100, Math.round(n / t * 100));
    return '<div class="card"><div class="row between"><h2>وردي اليوم</h2><span class="chip num">' + n + " / " + t + ' صفحة</span></div>' +
      '<div class="bar ' + (n >= t ? "" : "") + '"><i style="width:' + pct + '%"></i></div>' +
      '<div class="row wrapr" style="margin-block-start:12px">' +
      '<button class="btn sm" data-act="pg" data-n="1">+1 صفحة</button><button class="btn sm" data-act="pg" data-n="5">+5</button>' +
      (n < t ? '<button class="btn sm alt" data-act="pgdone">أتممت وردي</button>' : '<span class="chip" style="color:var(--done)">✓ أتممت وردك</span>') +
      '<button class="btn sm alt" data-act="pg" data-n="-1">−1</button></div></div>';
  }

  function learnMini(now) {
    var due = dueCards(now).length, ms = mistakeIds().length, L = level();
    return '<div class="card"><div class="row between"><h2>تعلّم</h2><span class="chip">المستوى <span class="num">' + L.lv + '</span></span></div>' +
      '<p class="muted" style="font-size:14px;margin-block-end:10px">' + due + " كلمة مستحقة للمراجعة" + (ms ? " · " + ms + " سؤال من أخطائك" : "") + '</p>' +
      '<button class="btn" data-act="tab" data-t="learn">افتح الكورس</button></div>';
  }

  function greetingHTML(now) {
    var h = now.h, txt, ic;
    if (h >= 4 && h < 11) { txt = "صباح الخير ☀️"; }
    else if (h >= 11 && h < 17) { txt = "يوم سعيد 🌿"; }
    else if (h >= 17 && h < 20) { txt = "مساء الخير 🌇"; }
    else { txt = "مساء النور 🌙"; }
    return '<div class="greet">' + txt + '</div>';
  }
  // Generic single-arc percentage ring (unlike ringSVG() above, which is specifically
  // the 5-segment prayer ring) — used by the "خطة اليوم" plan card for its overall %.
  function pctRingSVG(pct) {
    var r = 58, C = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct || 0)), dash = C * p / 100;
    return '<svg viewBox="0 0 140 140" class="ring" aria-hidden="true">' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="color-mix(in srgb, var(--teal-ink) 22%, transparent)" stroke-width="12"/>' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="var(--teal-ink)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(2) + " " + (C - dash).toFixed(2) + '" transform="rotate(-90 70 70)"/></svg>';
  }
  // Up to 4 lines — one each for prayer/quran, two for learn (review + lesson) — each
  // skipped when its section isn't allowed for the signed-in account (state.allowedSections,
  // kept in sync by applyPermissions()). This is what the plan ring's % is an average of.
  function planLines(now) {
    var allow = state.allowedSections || ["prayer", "quran", "learn", "exp"], lines = [];
    if (allow.indexOf("prayer") >= 0) {
      var doneN = PRAYERS.map(function (p, i) { return status(now.key, i, now); }).filter(isDone).length;
      lines.push({ key: "prayer", ic: "moon", text: doneN + "/5 صلوات", frac: doneN / 5 });
    }
    if (allow.indexOf("quran") >= 0) {
      var t = target(), n = pagesOn(now.key);
      lines.push({ key: "quran", ic: "book", text: n + "/" + t + " صفحة", frac: t ? Math.min(1, n / t) : 1 });
    }
    if (allow.indexOf("learn") >= 0) {
      var due = dueCards(now).length;
      lines.push({ key: "review", ic: "refresh", text: due ? due + " كلمة محتاجة مراجعة" : "خلصت مراجعتك النهاردة", frac: due ? 0 : 1 });
      var goalMin = state.settings.personalGoalMin || state.dailyGoalMin || 0;
      if (goalMin > 0) {
        var mins = Math.round(((state.learn.minutes || {})[now.key] || 0) * 10) / 10;
        lines.push({ key: "lesson", ic: "cap", text: mins + "/" + goalMin + " دقيقة مذاكرة", frac: Math.min(1, mins / goalMin) });
      } else {
        var studied = (state.learn.study && state.learn.study[now.key]) > 0;
        lines.push({ key: "lesson", ic: "cap", text: studied ? "ذاكرت درس النهاردة" : "لسه ما ذاكرتش درس النهاردة", frac: studied ? 1 : 0 });
      }
    }
    return lines;
  }
  // "كمّل من مكانك": one resume target at a time, in a fixed priority order — the lesson
  // actually left mid-way through matters more than a cold "go review vocab" nudge, which
  // in turn beats a bare "go to the tab" suggestion for prayer/quran (those already have
  // their own obvious entry points, so they're the fallback, not the first idea).
  function planResume(now) {
    var allow = state.allowedSections || ["prayer", "quran", "learn", "exp"];
    var r = state.learn.resume;
    if (allow.indexOf("learn") >= 0 && r && r.c && r.u && COURSES[r.c]) {
      var ru = unitOf(r.c, r.u);
      var rp = state.learn.units[r.c + ":" + r.u];
      if (ru && !(rp && rp.done)) return { label: "كمّل من مكانك", sub: COURSES[r.c].title + " · " + ru.title, act: "resume-lesson", c: r.c, u: r.u };
    }
    if (allow.indexOf("learn") >= 0 && dueCards(now).length) {
      return { label: "كمّل من مكانك", sub: "مراجعة " + dueCards(now).length + " كلمة مستحقة", act: "resume-review" };
    }
    if (allow.indexOf("prayer") >= 0) {
      var actionable = PRAYERS.some(function (p, i) { var s = status(now.key, i, now); return s === "current" || s === "missed"; });
      if (actionable) return { label: "كمّل من مكانك", sub: "سجّل صلاتك", act: "resume-prayer" };
    }
    if (allow.indexOf("quran") >= 0) {
      var t2 = target(), n2 = pagesOn(now.key);
      if (n2 < t2) return { label: "كمّل من مكانك", sub: "كمّل وِردك (" + (t2 - n2) + " صفحة باقية)", act: "resume-quran" };
    }
    return null;
  }
  var planCelebratedKey = null; // in-memory only — re-plays once per fresh page load at most, not on every render()
  function planCardHTML(now) {
    var lines = planLines(now);
    var pct = lines.length ? Math.round(lines.reduce(function (a, l) { return a + l.frac; }, 0) / lines.length * 100) : 0;
    var miss = state.loaded ? missedList(now).length : 0;
    var missLine = miss ? '<div class="plan-line plan-miss"><span class="pl-ic">' + ico("shield") + '</span><span class="grow">فاتتك ' + miss + (miss === 1 || miss > 10 ? " صلاة" : " صلوات") + ' — سجّل القضاء</span><button class="btn sm" data-act="tab" data-t="prayer">شوفها</button></div>' : "";
    var linesHTML = lines.map(function (l) {
      return '<div class="plan-line' + (l.frac >= 1 ? " done" : "") + '"><span class="pl-ic">' + (l.frac >= 1 ? ico("check") : ico(l.ic)) + '</span><span class="grow">' + esc(l.text) + "</span></div>";
    }).join("");
    var resume = planResume(now), celebrate = lines.length > 0 && pct >= 100 && !resume;
    // The pop animation plays only the first time this session that the plan reaches
    // 100% — celebrate stays true (so the message keeps showing) on every re-render
    // after that, but the "just now" class is only applied once, so the animation
    // doesn't replay on every unrelated render() call while the ring stays full.
    var justNow = celebrate && planCelebratedKey !== now.key;
    if (celebrate) planCelebratedKey = now.key;
    var bottom;
    if (resume) {
      bottom = '<button class="btn plan-resume" data-act="' + resume.act + '"' + (resume.c ? ' data-c="' + resume.c + '" data-u="' + resume.u + '"' : "") + '><span class="pr-l">' + esc(resume.label) + '</span><span class="pr-s">' + esc(resume.sub) + "</span></button>";
    } else if (celebrate) {
      bottom = '<div class="plan-done">🎉 خلّصت خطة اليوم النهاردة، ما شاء الله!</div>';
    } else {
      bottom = "";
    }
    return '<div class="card plan' + (justNow ? " celebrate" : "") + '"><div class="hero"><div class="ringbox">' + pctRingSVG(pct) +
      '<div class="ringtxt"><b class="num">' + pct + '%</b><span>خطة اليوم</span></div></div>' +
      '<div class="grow plan-lines">' + (linesHTML || '<p style="opacity:.85;font-size:14px">مفيش أقسام متاحة للمتابعة دلوقتي</p>') + "</div></div>" +
      missLine + bottom + "</div>";
  }
  function homeView(now) {
    if (state.settingsOpen) return settingsHTML(now);
    if (state.hv === "weekly") return weeklyReportHTML(now);
    return greetingHTML(now) + bannerHTML() + planCardHTML(now) + dailyCardHTML(now) +
      '<div class="card" style="margin-block-start:12px"><div class="row between"><h3 style="margin:0">الصلوات آخر 7 أيام</h3><button class="linkbtn" data-act="weekly-open">تقرير الأسبوع ←</button></div><div class="week">' + weekBars(now) + "</div></div>";
  }
  function settingsHTML(now) {
    return '<button class="linkbtn" data-act="settings-close">← رجوع</button><div class="sec-h">الإعدادات</div>' + pushCardHTML() +
      '<div class="card"><h3 style="margin:0 0 6px">المظهر</h3><p class="muted" style="font-size:13px;margin-block-end:10px">النهاري / الليلي / حسب الجهاز</p><button class="btn sm alt" data-act="theme">' + esc(THEME_LBL[getTheme()]) + "</button></div>" +
      '<div class="card"><h3 style="margin:0 0 6px">سرعة النطق</h3><p class="muted" style="font-size:13px;margin-block-end:10px">سرعة زرار 🔊 العادي — الضغطة الطويلة على 🔊 دايمًا بتنطق ببطء زيادة عن كده.</p>' +
      '<div class="row wrapr">' + SPEECH_RATES.map(function (r) {
        return '<button class="chipbtn' + ((state.settings.speechRate || 0.92) === r.v ? " on" : "") + '" data-act="speech-rate" data-v="' + r.v + '">' + r.lbl + "</button>";
      }).join("") + "</div></div>" +
      '<div class="card"><h3 style="margin:0 0 6px">الهدف اليومي بالدقايق</h3><p class="muted" style="font-size:13px;margin-block-end:10px">قد إيه ناوي تذاكر كل يوم — بيظهر في خطة اليوم بالدقايق بدل علامة تمت/لأ.</p>' +
      '<div class="row wrapr">' + [5, 10, 15, 20].map(function (m) {
        return '<button class="chipbtn' + ((state.settings.personalGoalMin || 0) === m ? " on" : "") + '" data-act="goal-min-set" data-v="' + m + '">' + m + " د</button>";
      }).join("") + '<button class="chipbtn' + (!state.settings.personalGoalMin ? " on" : "") + '" data-act="goal-min-set" data-v="0">بدون</button></div></div>' +
      '<div class="card"><h3 style="margin:0 0 6px">حدود المراجعة اليومية</h3>' +
      '<p class="muted" style="font-size:13px;margin-block-end:10px">' + (state.dailyNewWordLimit > 0 ? "حدّ الكلمات الجديدة اللي ضبطه المسؤول: " + state.dailyNewWordLimit + "/يوم — تقدر تقلّله هنا لكن متزودّه عليه." : "تقدر تتحكم في عدد الكلمات الجديدة والمراجعات اللي تظهر لك كل يوم.") + "</p>" +
      '<div class="row wrapr" style="gap:14px">' +
      '<label class="field" style="max-width:150px">كلمات جديدة/يوم<input class="inp" type="number" min="0" id="setNewLimit" value="' + (state.settings.dailyNewWordLimit || "") + '" placeholder="' + srsNewLimit() + '"></label>' +
      '<label class="field" style="max-width:150px">مراجعات/يوم<input class="inp" type="number" min="0" id="setReviewLimit" value="' + (state.settings.dailyReviewLimit || "") + '" placeholder="30"></label>' +
      "</div></div>";
  }

  /* ---------------- render ---------------- */
  var TABS = ["home", "prayer", "quran", "learn", "exp"], panelCache = {};
  // Per-account section permissions ("home" is always visible — only these four
  // are ever toggled off). Hides the bottom-nav button and the panel itself, and
  // bumps the user off a tab that just got hidden out from under them.
  var TOGGLEABLE_SECTIONS = ["prayer", "quran", "learn", "exp"];
  function applyPermissions(acc) {
    ALLOWED_COURSES = (Array.isArray(acc && acc.courses) && acc.courses.length)
      ? COURSE_ORDER.filter(function (c) { return acc.courses.indexOf(c) >= 0; })
      : COURSE_ORDER.slice();
    var allowedSections = (Array.isArray(acc && acc.sections) && acc.sections.length) ? acc.sections : null;
    // Kept on state (not just applied to the DOM below) so view code — the "خطة اليوم"
    // plan card above all — can ask "is this section allowed for the signed-in account"
    // without re-deriving it from the DOM.
    state.allowedSections = allowedSections ? allowedSections.slice() : TOGGLEABLE_SECTIONS.slice();
    // Per-account learning settings the admin can set from "الصلاحيات" — 0 means
    // "no admin-set limit", so Phase 7's SRS daily cap falls back to its own default.
    state.dailyGoalMin = (acc && acc.dailyGoalMin) || 0;
    state.dailyNewWordLimit = (acc && acc.dailyNewWordLimit) || 0;
    TOGGLEABLE_SECTIONS.forEach(function (s) {
      var hide = !!(allowedSections && allowedSections.indexOf(s) < 0);
      var btn = document.querySelector('.tabs button[data-t="' + s + '"]');
      var li = btn && btn.closest("li");
      if (li) li.hidden = hide;
      var panel = document.getElementById("p-" + s);
      if (panel) panel.hidden = hide;
      if (hide && state.tab === s) goTab("home");
    });
  }
  function resetPermissions() { applyPermissions(null); }
  var AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  var THEMES = ["light", "dark", "auto"], THEME_LBL = { light: "نهاري", dark: "ليلي", auto: "تلقائي" };
  function getTheme() { try { return localStorage.getItem("masar:theme") || "light"; } catch (e) { return "light"; } }
  function applyTheme(t) {
    var r = document.documentElement;
    if (t === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
    var b = $("#theme"); if (b) b.textContent = THEME_LBL[t];
  }
  function markTabs() {
    document.querySelectorAll(".tabs button").forEach(function (b) {
      if (b.getAttribute("data-t") === state.tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }
  function goTab(t) {
    state.tab = t; markTabs();
    var el = $("#p-" + t); if (el) el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }
  function render() {
    var now = nowR();
    var views = { home: homeView(now), prayer: prayerView(now), quran: quranView(now), learn: learnView(now), exp: expView(now) };
    var active = document.activeElement, keepId = active && active.id, keepVal = active && active.value, keepSel = active && active.selectionStart;
    TABS.forEach(function (k) {
      if (panelCache[k] !== views[k]) {
        var el = $("#p-" + k), st = el.scrollTop; el.innerHTML = views[k]; el.scrollTop = st; panelCache[k] = views[k];
      }
    });
    if (keepId) { var el2 = document.getElementById(keepId); if (el2 && el2.tagName === "INPUT" && el2.type !== "date") { el2.value = keepVal; el2.focus(); try { el2.setSelectionRange(keepSel, keepSel); } catch (e) { } } }
    var h = hijri(now.key); $("#dates").textContent = greg(now.key) + (h ? " · " + h : "");
    $("#lockbtn").hidden = state.mode !== "supa";
    markTabs();
    if (state.tab === "learn" && state.lv && state.lv.mode === "cert") drawCertPreview(state.lv.c);
    lastSig = signature();
  }
  var lastSig = "";
  function signature() {
    var now = nowR();
    return now.key + ":" + PRAYERS.map(function (p, i) { return status(now.key, i, now); }).join(",");
  }
  // Real elapsed-time tracker for the "تعلّم" tab, feeding learn.minutes — only ticks
  // while that tab is the active one, the page is visible, and an account is actually
  // signed in/loaded (so a brand-new local session sitting on the lock screen, or a
  // background tab, never accrues time). Saved every full minute, debounced like any
  // other meta write.
  var learnMinuteAccumMs = 0;
  function tick() {
    var el = $("#cd");
    if (el) {
      var now = nowR(), left = (parseFloat(el.getAttribute("data-t")) - now.h) * 3600;
      el.textContent = fmtDur(left);
    }
    if (state.loaded && state.tab === "learn" && !document.hidden) {
      learnMinuteAccumMs += 1000;
      if (learnMinuteAccumMs >= 60000) {
        learnMinuteAccumMs -= 60000;
        var mk = nowR().key;
        if (!state.learn.minutes) state.learn.minutes = {};
        state.learn.minutes[mk] = (state.learn.minutes[mk] || 0) + 1;
        saveMeta("learn", 3000);
      }
    } else {
      learnMinuteAccumMs = 0;
    }
    if (signature() !== lastSig) render();
  }


  /* ---------------- events ---------------- */
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "bankq") { state.bankQ = e.target.value; render(); }
  });
  // Phase 9: long-press on any 🔊 button speaks slower, regardless of the normal
  // speechRate setting. spkHoldFired suppresses the "speak" click case right after,
  // so a long press doesn't ALSO fire the normal-speed tap when the finger lifts.
  var spkHoldTimer = null, spkHoldFired = false;
  function spkHoldClear() { if (spkHoldTimer) { clearTimeout(spkHoldTimer); spkHoldTimer = null; } }
  document.addEventListener("pointerdown", function (e) {
    var el = e.target.closest('[data-act="speak"]'); if (!el) return;
    spkHoldFired = false;
    spkHoldTimer = setTimeout(function () { spkHoldFired = true; speak(el.getAttribute("data-txt"), true); }, 550);
  });
  document.addEventListener("pointerup", spkHoldClear);
  document.addEventListener("pointercancel", spkHoldClear);
  document.addEventListener("pointerleave", spkHoldClear, true);
  // Swipe-to-reveal on expense rows: a real horizontal swipe (not just a tap) reveals the
  // تعديل/حذف buttons for that row, same end state as tapping the row's own trash icon
  // (exp-swipe, in the click handler below) — so the feature works whether someone swipes
  // the way a list usually works on a phone, or just taps, without needing drag-following
  // CSS transforms. touch-action:pan-y on .exprow (see CSS) keeps vertical scroll free.
  (function () {
    var startX = 0, startY = 0, swipeRow = null, tracking = false;
    document.addEventListener("touchstart", function (e) {
      var row = e.target.closest(".exprow"); if (!row || !row.getAttribute("data-swipeid")) { tracking = false; return; }
      var t = e.touches[0]; startX = t.clientX; startY = t.clientY; swipeRow = row; tracking = true;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!tracking || !swipeRow) return; tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        var id = swipeRow.getAttribute("data-swipeid");
        state.expSwipeId = state.expSwipeId === id ? null : id; render();
      }
      swipeRow = null;
    }, { passive: true });
  })();
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"), now = nowR();
    switch (act) {
      case "lock": lockNow(); break;
      case "speak": if (spkHoldFired) { spkHoldFired = false; break; } speak(el.getAttribute("data-txt")); break;
      case "speech-rate": state.settings.speechRate = Number(el.getAttribute("data-v")) || 0.92; saveMeta("settings", 0); render(); break;
      case "goal-min-set": state.settings.personalGoalMin = Number(el.getAttribute("data-v")) || 0; saveMeta("settings", 0); render(); break;
      case "push-on": enablePush(); break;
      case "push-off": disablePush(); break;
      case "theme": var cur = getTheme(), nx = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]; try { localStorage.setItem("masar:theme", nx); } catch (er) { } applyTheme(nx); break;
      case "pv": state.pv = el.getAttribute("data-v"); render(); break;
      case "tab": var tt = el.getAttribute("data-t"); if (tt === "archive") { state.pv = "archive"; tt = "prayer"; } goTab(tt); render(); break;
      case "tp": togglePrayer(el.getAttribute("data-d"), Number(el.getAttribute("data-p"))); break;
      case "more": state.archiveN += 30; render(); break;
      case "pg": addPages(Number(el.getAttribute("data-n"))); break;
      case "pgdone": setPages(Math.max(pagesOn(now.key), target())); toast("تقبّل الله ورد اليوم"); break;
      case "unit": state.settings.unit = el.getAttribute("data-u"); saveMeta("settings", 400); render(); break;
      case "amt": state.settings.amount = Math.max(1, Math.min(60, state.settings.amount + Number(el.getAttribute("data-n")))); saveMeta("settings", 400); render(); break;
      case "weekly-open": state.hv = "weekly"; $("#p-home").scrollTop = 0; render(); break;
      case "weekly-close": state.hv = "dashboard"; render(); break;
      case "settings-open": state.settingsOpen = true; goTab("home"); $("#p-home").scrollTop = 0; render(); break;
      case "settings-close": state.settingsOpen = false; render(); break;
      case "resume-lesson":
        var rsC = el.getAttribute("data-c"), rsU = el.getAttribute("data-u"), rsUnit = unitOf(rsC, rsU); if (!rsUnit) break;
        state.lv = { mode: rsUnit.kind === "dialogue" ? "dialogue" : "lesson", c: rsC, u: rsU, step: 0 }; goTab("learn"); render(); break;
      case "resume-review": state.card = { q: buildReviewQueue(now, null, 0, 10), i: 0, flip: false, known: 0, global: true }; state.lv = { mode: "cards", c: null }; goTab("learn"); render(); break;
      case "resume-prayer": goTab("prayer"); render(); break;
      case "resume-quran": goTab("quran"); render(); break;
      case "azkar-open": state.az = el.getAttribute("data-k"); $("#p-prayer").scrollTop = 0; render(); break;
      case "azkar-close": state.az = null; render(); break;
      case "azkar-tap": var azK = el.getAttribute("data-k"), azI = Number(el.getAttribute("data-i"));
        if (state.azProgress[azK] && state.azProgress[azK][azI] > 0) {
          state.azProgress[azK][azI]--;
          var azFinished = state.azProgress[azK][azI] <= 0;
          try { navigator.vibrate && navigator.vibrate(azFinished ? [12, 40, 12] : 10); } catch (eVib) { }
          if (azFinished && state.azOpen && state.azOpen[azK] === azI) {
            state.azOpen[azK] = state.azProgress[azK].findIndex(function (c) { return c > 0; });
          }
        }
        render(); break;
      case "azkar-reset": var azRk = el.getAttribute("data-k"); state.azProgress[azRk] = AZKAR[azRk].map(function (it) { return it.n; }); if (!state.azOpen) state.azOpen = {}; state.azOpen[azRk] = 0; render(); break;
      case "lcourses": state.lv = { mode: "courses" }; state.quiz = null; state.card = null; state.spk = null; state.ndraft = null; render(); break;
      case "course-open": state.lv = { mode: "home", c: el.getAttribute("data-c") }; $("#p-learn").scrollTop = 0; render(); scrollToCurPathNode(); break;
      case "lhome": state.lv = { mode: "home", c: el.getAttribute("data-c") || state.lv.c }; state.quiz = null; state.card = null; state.spk = null; state.ndraft = null; render(); scrollToCurPathNode(); break;
      case "unit-open": var uoC = el.getAttribute("data-c"), uoU = el.getAttribute("data-u"), uoUnit = unitOf(uoC, uoU);
        state.lv = { mode: uoUnit.kind === "dialogue" ? "dialogue" : "lesson", c: uoC, u: uoU, step: 0 }; $("#p-learn").scrollTop = 0;
        state.learn.resume = { c: uoC, u: uoU }; saveMeta("learn", 400); render(); break;
      case "unit-flat": var ufC = el.getAttribute("data-c"), ufU = el.getAttribute("data-u"); state.lv = { mode: "unit", c: ufC, u: ufU }; $("#p-learn").scrollTop = 0;
        state.learn.resume = { c: ufC, u: ufU }; saveMeta("learn", 400); render(); break;
      case "reading-open": var roC = el.getAttribute("data-c"), roU = el.getAttribute("data-u"); state.lv = { mode: "reading", c: roC, u: roU, tr: false }; $("#p-learn").scrollTop = 0;
        state.learn.resume = { c: roC, u: roU }; saveMeta("learn", 400); render(); break;
      case "reading-tr": state.lv.tr = !state.lv.tr; render(); break;
      case "lstep": var lsC = el.getAttribute("data-c"), lsU = el.getAttribute("data-u"), lsD = Number(el.getAttribute("data-d"));
        state.lv = { mode: "lesson", c: lsC, u: lsU, step: (state.lv.step || 0) + lsD }; $("#p-learn").scrollTop = 0; render(); break;
      case "lesson-next": state.lv.step = (state.lv.step || 0) + 1; state.lv.ans = null; $("#p-learn").scrollTop = 0; render(); break;
      case "lesson-retry-next": if (state.lv.retry) state.lv.retry.shift(); state.lv.ans = null; $("#p-learn").scrollTop = 0; render(); break;
      case "lesson-jump": state.lv.step = Number(el.getAttribute("data-step")) || 0; state.lv.ans = null; render(); break;
      case "lesson-quiz-pick": lessonQuizAnswer(el.getAttribute("data-v"), el.getAttribute("data-k")); break;
      case "lesson-quiz-submit": var lqIn = $("#lessonQA"); lessonQuizAnswer(lqIn ? lqIn.value : "", el.getAttribute("data-k")); break;
      case "lesson-prod-submit": lessonProdAnswer(); break;
      case "weak-add-point": addWeak(el.getAttribute("data-pid"), "point", "manual", el.getAttribute("data-cid") || null, now, { text: el.getAttribute("data-text") }); toast("🎯 ضيفت النقطة لنقاط ضعفي"); render(); break;
      case "locked-unit": toast("أكمل " + el.getAttribute("data-need") + " وحدات في الكورس الأول عشان يتفتح"); break;
      case "quiz": var qc = el.getAttribute("data-c"), u = COURSES[qc].units.filter(function (x) { return x.id === el.getAttribute("data-u"); })[0]; state.lv.c = qc; startQuiz(u.qs, u.title, qc + ":" + u.id); break;
      case "mrev": var mc = el.getAttribute("data-c"); state.lv.c = mc; startQuiz(mistakeIds(mc).map(function (id) { return QINDEX[id]; }), "مراجعة الأخطاء", null); break;
      case "weak-open": state.lv = { mode: "weak" }; state.wd = null; goTab("learn"); $("#p-learn").scrollTop = 0; render(); break;
      case "weak-tab": state.weakTab = el.getAttribute("data-t"); render(); break;
      case "weak-start": weakStart(el.getAttribute("data-id")); break;
      case "weak-pick": weakPick(el.getAttribute("data-v")); break;
      case "weak-submit": weakSubmitTyped(); break;
      case "weak-add": addWeak(el.getAttribute("data-id"), el.getAttribute("data-kind"), "manual", el.getAttribute("data-cid") || null, now); toast("🎯 ضيفت للكلمة لنقاط ضعفي"); render(); break;
      case "pick": answerMcq(el.getAttribute("data-k")); break;
      case "submit": answerFill(); break;
      case "ord-pick": if (!state.quiz.ans) { state.quiz.pick.push(Number(el.getAttribute("data-i"))); render(); } break;
      case "ord-rm": if (!state.quiz.ans) { state.quiz.pick.splice(Number(el.getAttribute("data-p")), 1); render(); } break;
      case "ord-submit": answerOrder(); break;
      case "pick-tf": answerTf(el.getAttribute("data-v") === "true"); break;
      case "match-l": answerMatchL(Number(el.getAttribute("data-i"))); break;
      case "match-r": answerMatchR(Number(el.getAttribute("data-i"))); break;
      case "qnext": state.quiz.i++; state.quiz.ans = null; state.quiz.pick = []; state.quiz.matchR = null; state.quiz.matchDone = null; state.quiz.matchSel = null; if (state.quiz.i >= state.quiz.qs.length) finishQuiz(); render(); break;
      case "cardlvl": state.cardLvl = Number(el.getAttribute("data-lvl")) || 0; render(); break;
      case "cards": var cc = el.getAttribute("data-c"); state.lv.c = cc; state.card = { q: buildReviewQueue(now, cc, state.cardLvl || 0, 15), i: 0, flip: false, known: 0 }; state.lv = { mode: "cards", c: cc }; render(); break;
      case "daily-review": state.card = { q: buildReviewQueue(now, null, 0, 10), i: 0, flip: false, known: 0, global: true }; state.lv = { mode: "cards", c: null }; goTab("learn"); render(); break;
      case "exambank": var ebC = el.getAttribute("data-c"), ebCourse = COURSES[ebC]; if (!ebCourse || !ebCourse.examBank || !ebCourse.examBank.length) break;
        state.lv.c = ebC; startQuiz(shuffle(ebCourse.examBank.slice()).slice(0, Math.min(20, ebCourse.examBank.length)), "بنك أسئلة آيزو · " + ebCourse.title, null); break;
      case "milestone-exam": startMilestoneExam(el.getAttribute("data-c"), Number(el.getAttribute("data-n"))); break;
      case "weekly-challenge-start": startWeeklyChallenge(now); break;
      case "final-exam": var feC = el.getAttribute("data-c"), feCourse = COURSES[feC]; if (!feCourse) break;
        var fePool = shuffle(finalExamPool(feC).slice()); var feTake = Math.min(30, fePool.length); if (!feTake) break;
        state.lv.c = feC;
        state.quiz = { qs: shuffle(fePool.slice(0, feTake)), i: 0, ok: 0, ans: null, title: "الامتحان النهائي · " + feCourse.title, unit: null, wrong: [], right: [], pick: [], final: true, examCid: feC };
        state.lv = { mode: "quiz", c: feC }; render(); break;
      case "cert-open": state.lv = { mode: "cert", c: el.getAttribute("data-c") }; $("#p-learn").scrollTop = 0; render(); break;
      case "cert-name-save": var cnIn = $("#certNameInput"), cnV = cnIn ? cnIn.value.trim() : ""; state.settings.certName = cnV; saveMeta("settings", 0); render(); break;
      case "cert-download": downloadCertificate(el.getAttribute("data-c")); break;
      case "flip": if (state.card) { state.card.flip = true; render(); } break;
      case "grade": gradeCard(el.getAttribute("data-r")); break;
      case "card-pick": cardAnswer(el.getAttribute("data-v")); break;
      case "card-submit": var caIn = $("#cardAns"); cardAnswer(caIn ? caIn.value : "", true); break;
      case "card-mic": cardMic(); break;
      case "exp-month": state.expMonth = shiftMonth(curExpMonth(now), Number(el.getAttribute("data-n"))); state.expAdd = false; render(); break;
      case "exp-sal-edit": state.expSalEdit = true; render(); break;
      case "exp-sal-save": var esIn = $("#expSalInput"), esV = esIn ? Math.max(0, parseFloat(esIn.value) || 0) : 0; state.exp.salary[curExpMonth(now)] = esV; state.expSalEdit = false; saveMeta("exp", 300); render(); break;
      case "exp-add-toggle": state.expAdd = !state.expAdd; state.expNewCat = false; state.expEditId = null; state.expCat = ""; state.expKind = "expense"; render(); break;
      case "exp-kind": state.expKind = el.getAttribute("data-k") === "advance" ? "advance" : "expense"; render(); break;
      case "exp-cat-pick": state.expCat = el.getAttribute("data-c"); state.expNewCat = false; render(); break;
      case "exp-cat-new-toggle": state.expNewCat = true; render(); break;
      case "exp-cat-new-save":
        var ncIn = $("#expNewCatInput"), ncV = ncIn ? ncIn.value.trim() : "";
        if (ncV && state.exp.categories.indexOf(ncV) === -1) state.exp.categories.push(ncV);
        if (ncV) { state.expCat = ncV; saveMeta("exp", 300); }
        state.expNewCat = false; render(); break;
      case "exp-edit":
        var editIt = state.exp.items.filter(function (x) { return x.id === el.getAttribute("data-id"); })[0]; if (!editIt) break;
        state.expEditId = editIt.id; state.expCat = editIt.cat; state.expKind = editIt.kind === "advance" ? "advance" : "expense";
        state.expAdd = true; state.expSwipeId = null; render(); break;
      case "exp-save":
        var eaIn = $("#expAmt"), edIn = $("#expDate"), enIn = $("#expNote");
        var eAmt = eaIn ? parseFloat(eaIn.value) : NaN, eDate = edIn && edIn.value ? edIn.value : now.key, eNote = enIn ? enIn.value.trim() : "";
        if (!state.expCat) { toast("اختار بند المصروف الأول"); break; }
        if (!eAmt || eAmt <= 0) { toast("اكتب مبلغ صحيح"); break; }
        if (state.expEditId) {
          var editTarget = state.exp.items.filter(function (x) { return x.id === state.expEditId; })[0];
          if (editTarget) { editTarget.cat = state.expCat; editTarget.amount = eAmt; editTarget.date = eDate; editTarget.note = eNote; editTarget.kind = state.expKind === "advance" ? "advance" : undefined; }
          state.expEditId = null;
        } else {
          state.exp.items.push({ id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: eDate, cat: state.expCat, amount: eAmt, note: eNote, kind: state.expKind === "advance" ? "advance" : undefined });
        }
        state.expAdd = false; state.expCat = ""; state.expKind = "expense"; saveMeta("exp", 200);
        if (eDate.slice(0, 7) !== curExpMonth(now)) state.expMonth = eDate.slice(0, 7);
        render(); toast(state.expEditId ? "تم الحفظ" : "تم تسجيل المصروف"); break;
      case "exp-swipe": state.expSwipeId = state.expSwipeId === el.getAttribute("data-id") ? null : el.getAttribute("data-id"); render(); break;
      case "exp-del":
        var delId = el.getAttribute("data-id"), delIdx = state.exp.items.findIndex(function (x) { return x.id === delId; });
        if (delIdx < 0) break;
        var delItem = state.exp.items[delIdx];
        state.exp.items.splice(delIdx, 1); state.expSwipeId = null; saveMeta("exp", 0); render();
        undoToast("تم حذف المصروف", function () { state.exp.items.splice(Math.min(delIdx, state.exp.items.length), 0, delItem); saveMeta("exp", 0); render(); });
        break;
      case "exp-repay": var repIt = state.exp.items.filter(function (x) { return x.id === el.getAttribute("data-id"); })[0]; if (repIt) { repIt.repaid = true; repIt.repaidDate = now.key; saveMeta("exp", 0); } render(); toast("تم تسجيل الرد"); break;
      case "exp-budget-edit": state.expBudgetEditCat = el.getAttribute("data-c"); render(); break;
      case "exp-budget-save":
        var bc = el.getAttribute("data-c"), bIn = $("#expBudgetInput"), bV = bIn ? Math.max(0, parseFloat(bIn.value) || 0) : 0;
        if (bV) state.exp.budgets[bc] = bV; else delete state.exp.budgets[bc];
        state.expBudgetEditCat = null; saveMeta("exp", 200); render(); break;
      case "exp-recur-toggle": state.expRecurAdd = !state.expRecurAdd; state.expCat = ""; render(); break;
      case "exp-recur-save":
        var raIn = $("#expRecurAmt"), rnIn = $("#expRecurNote");
        var raV = raIn ? parseFloat(raIn.value) : NaN, rnV = rnIn ? rnIn.value.trim() : "";
        if (!state.expCat) { toast("اختار بند المصروف الأول"); break; }
        if (!raV || raV <= 0) { toast("اكتب مبلغ صحيح"); break; }
        state.exp.recurring.push({ id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), cat: state.expCat, amount: raV, note: rnV });
        state.expRecurAdd = false; state.expCat = ""; saveMeta("exp", 200); render(); toast("تم إضافة المصروف الثابت"); break;
      case "exp-recur-del": state.exp.recurring = state.exp.recurring.filter(function (x) { return x.id !== el.getAttribute("data-id"); }); saveMeta("exp", 200); render(); break;
      case "exp-recur-apply":
        var dueNow = expRecurringDueToday(curExpMonth(now), now), addedDate = now.key;
        dueNow.forEach(function (r) { state.exp.items.push({ id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + r.id.slice(-3), date: addedDate, cat: r.cat, amount: r.amount, note: r.note, recurId: r.id }); });
        saveMeta("exp", 0); render(); toast("تم إضافة " + dueNow.length + " بند ثابت"); break;
      case "exp-undo": if (undoPending) { var fn = undoPending; undoPending = null; clearTimeout(undoT); $("#toast").classList.remove("on"); fn(); } break;
      case "daily-start": startDailyChallenge(now); break;
      case "speak-start": startSpeakChallenge(el.getAttribute("data-c")); break;
      case "speak-listen": spkListen(); break;
      case "speak-next": spkNext(now); break;
      case "badge-info": var bi = ACHIEVEMENTS.filter(function (x) { return x.id === el.getAttribute("data-b"); })[0]; if (bi) toast((state.learn.badges[bi.id] ? "🏆 " : "🔒 ") + bi.title + " — " + bi.desc); break;
      case "notes-open": state.lv = { mode: "notes", c: el.getAttribute("data-c") }; state.ndraft = freshDraft(); $("#p-learn").scrollTop = 0; render(); break;
      case "mysent-open": state.lv = { mode: "mysent", c: el.getAttribute("data-c") }; $("#p-learn").scrollTop = 0; render(); break;
      case "ms-save": var msIn = $("#msDraft"); if (msIn && msIn.value.trim()) { saveMySentence(el.getAttribute("data-c"), msIn.value, now); toast("تم الحفظ في جملي"); render(); } break;
      case "shadow-mic": shadowMic(Number(el.getAttribute("data-i")), el.getAttribute("data-txt")); break;
      case "dlg-save-sentence": var dlgIn = $("#dlgDraft"); if (dlgIn && dlgIn.value.trim()) { saveMySentence(el.getAttribute("data-c"), dlgIn.value, now); toast("تم الحفظ في جملي"); render(); } break;
      case "bank-open": state.lv = { mode: "bank", c: el.getAttribute("data-c") }; state.bankQ = ""; state.bankLvl = 0; state.bankNew = false; $("#p-learn").scrollTop = 0; render(); break;
      case "bank-lvl": state.bankLvl = Number(el.getAttribute("data-lvl")) || 0; render(); break;
      case "bank-new": state.bankNew = !state.bankNew; render(); break;
      case "bank-toggle": var bid = el.getAttribute("data-id"), nowB = nowR(), curB = state.learn.cards[bid] || { stage: 0, lapses: 0 };
        curB.stage = cardStage(curB);
        if (curB.stage >= 3) { curB.stage = 0; curB.due = nowB.key; } else { curB.stage = 3; curB.due = addDays(nowB.key, SRS_STAGE_DAYS[3]); }
        curB.box = curB.stage;
        state.learn.cards[bid] = curB; saveMeta("learn", 400); render(); break;
      case "note-row-add": captureDraft(); state.ndraft.rows.push({ label: "", ex: "" }); render(); break;
      case "note-row-del": captureDraft(); var nrI = Number(el.getAttribute("data-i")); if (state.ndraft.rows.length > 1) state.ndraft.rows.splice(nrI, 1); render(); break;
      case "note-add":
        captureDraft();
        var noC = el.getAttribute("data-c"), d = state.ndraft, title = d.title.trim();
        var rowsClean = d.rows.map(function (r) { return { label: r.label.trim(), ex: r.ex.trim() }; }).filter(function (r) { return r.label && r.ex; });
        if (!title) { toast("اكتب عنوان القاعدة الأول"); break; }
        if (!rowsClean.length) { toast("ضيف بند واحد على الأقل مع مثاله"); break; }
        if (!state.learn.notes[noC]) state.learn.notes[noC] = [];
        state.learn.notes[noC].push({ id: "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), title: title, rows: rowsClean });
        state.ndraft = freshDraft(); saveMeta("learn", 0); render(); toast("تم الحفظ ف المهم"); break;
      case "note-del":
        var ndC = el.getAttribute("data-c"), ndId = el.getAttribute("data-id");
        if (state.learn.notes[ndC]) state.learn.notes[ndC] = state.learn.notes[ndC].filter(function (x) { return x.id !== ndId; });
        saveMeta("learn", 0); render(); break;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.id === "ans") { e.preventDefault(); answerFill(); }
    if (e.key === "Enter" && e.target && e.target.id === "weakAns") { e.preventDefault(); weakSubmitTyped(); }
    if (e.key === "Enter" && e.target && e.target.id === "cardAns") { e.preventDefault(); var caEl = $("#cardAns"); cardAnswer(caEl ? caEl.value : "", true); }
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.getAttribute && e.target.getAttribute("data-act") === "flip") { e.preventDefault(); if (state.card) { state.card.flip = true; render(); } }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "startdate" && t.value) { state.settings.startDate = t.value; saveMeta("settings"); render(); toast("تم تحديث بداية التتبع"); }
    if (t.id === "startpage") { var n = Math.max(1, Math.min(604, parseInt(t.value, 10) || 1)); state.settings.startPage = n; saveMeta("settings", 300); render(); }
    if (t.id === "setNewLimit") {
      var nl = Math.max(0, parseInt(t.value, 10) || 0);
      // Can narrow an admin-set ceiling further, never exceed it.
      if (state.dailyNewWordLimit > 0 && nl > state.dailyNewWordLimit) nl = state.dailyNewWordLimit;
      state.settings.dailyNewWordLimit = nl; saveMeta("settings", 300); render();
    }
    if (t.id === "setReviewLimit") { state.settings.dailyReviewLimit = Math.max(0, parseInt(t.value, 10) || 0); saveMeta("settings", 300); render(); }
  });

  // Phase 11 combo multiplier: consecutive correct answers within one quiz session
  // build a streak (z.combo); 3-in-a-row = x2 bonus XP on each further correct
  // answer, 6-in-a-row = x3, reset to 0 on any wrong answer. The bonus is banked
  // in z.comboBonus and added on top of the normal z.ok*10 in finishQuiz().
  function comboMult(streak) { return streak >= 6 ? 3 : (streak >= 3 ? 2 : 1); }
  function quizScore(z, q, ok) {
    if (ok) {
      z.ok++; z.right.push(q.id);
      z.combo = (z.combo || 0) + 1;
      var mult = comboMult(z.combo);
      z.lastCombo = mult;
      if (mult > 1) z.comboBonus = (z.comboBonus || 0) + (mult - 1) * 10;
      state.learn.bestCombo = Math.max(state.learn.bestCombo || 0, z.combo);
    } else {
      z.wrong.push(q.id); z.combo = 0;
    }
  }
  function answerMcq(k) {
    var z = state.quiz, q = z.qs[z.i]; if (z.ans) return;
    var sel = q.o[Number(k)], ok = sel === q.a;
    z.ans = { sel: sel, ok: ok }; quizScore(z, q, ok);
    render();
  }
  function answerFill() {
    var z = state.quiz, q = z.qs[z.i], inp = $("#ans"); if (z.ans || !inp) return;
    var v = inp.value; if (!norm(v)) return;
    var ok = q.a.map(norm).indexOf(norm(v)) !== -1;
    z.ans = { sel: v, ok: ok }; quizScore(z, q, ok);
    render();
  }
  function answerOrder() {
    var z = state.quiz, q = z.qs[z.i]; if (z.ans) return;
    var sel = z.pick.map(function (wi) { return q.words[wi]; });
    var ok = norm(sel.join(" ")) === norm(q.a.join(" "));
    z.ans = { sel: sel.join(" "), ok: ok }; quizScore(z, q, ok);
    render();
  }
  // Phase 10 — new qs types: "صح وغلط + السبب" (tf; q.why already carries the
  // reason and is shown the same way every other type's fb already shows it) and
  // "وصّل" (match; pairs graded one at a time as they're committed).
  function answerTf(val) {
    var z = state.quiz, q = z.qs[z.i]; if (z.ans) return;
    var ok = val === q.a;
    z.ans = { sel: val, ok: ok }; quizScore(z, q, ok);
    render();
  }
  function answerMatchL(li) {
    var z = state.quiz; if (!z || z.ans) return;
    if (!z.matchDone) z.matchDone = {};
    if (z.matchDone[li]) return;
    z.matchSel = li; render();
  }
  function answerMatchR(ri) {
    var z = state.quiz, q = z.qs[z.i]; if (!z || z.ans || z.matchSel == null) return;
    if (!z.matchDone) z.matchDone = {};
    var li = z.matchSel, ok = Number(li) === ri;
    z.matchDone[li] = { rightIdx: ri, ok: ok };
    z.matchSel = null;
    if (Object.keys(z.matchDone).length >= q.pairs.length) {
      var allOk = Object.keys(z.matchDone).every(function (k) { return z.matchDone[k].ok; });
      z.ans = { sel: "match", ok: allOk }; quizScore(z, q, allOk);
    }
    render();
  }
  // 4-button grading (Phase 7's SRS v2), replacing the old knowCard(yes)'s 2-button
  // (know/don't-know) version. rating is one of "forgot" | "hard" | "good" | "easy".
  function gradeCard(rating) {
    var c = state.card, w = c.q[c.i], now = nowR(), cur = state.learn.cards[w.id];
    var wasNew = !cur;
    if (!cur) cur = { stage: 0, lapses: 0 };
    cur.stage = cardStage(cur);
    var counters = srsDayCounters(now);
    if (wasNew) counters.newDone++; else counters.reviewDone++;
    if (rating === "forgot") {
      cur.stage = 0; cur.due = now.key; cur.lapses = (cur.lapses || 0) + 1;
      cur.lapseAt = (cur.lapseAt || []).filter(function (t) { return now.ms - t <= 14 * 86400000; });
      cur.lapseAt.push(now.ms);
      if (cur.lapseAt.length >= 2) addWeak(w.id, "word", "forget", w.c, now); // Phase 8: نسيان متكرر
    }
    else if (rating === "hard") { cur.stage = Math.max(0, cur.stage - 1); cur.due = addDays(now.key, SRS_STAGE_DAYS[cur.stage]); }
    else if (rating === "easy") { cur.stage = Math.min(SRS_MAX_STAGE, cur.stage + 2); cur.due = addDays(now.key, SRS_STAGE_DAYS[cur.stage]); }
    else { cur.stage = Math.min(SRS_MAX_STAGE, cur.stage + 1); cur.due = addDays(now.key, SRS_STAGE_DAYS[cur.stage]); } // "good"
    cur.box = cur.stage; // kept in sync — achievements/bank view still just check box/stage >= 3
    state.learn.cards[w.id] = cur;
    var yes = rating === "good" || rating === "easy";
    if (yes) { c.known++; addXp(3, now); }
    c.i++; c.flip = false; c.ans = null; c.listening = false;
    saveMeta("learn", c.i >= c.q.length ? 0 : 1500);
    if (yes) checkAchievements(now);
    render();
  }


  /* ---------------- supabase + lock ---------------- */
  function snap() { return JSON.stringify([state.days, state.settings, state.tab === "learn" ? 0 : state.learn, state.exp]); }
  function showLock(msg) {
    $("#lock").hidden = false; $("#lockmsg").textContent = msg || "";
    var pin = $("#pin"); pin.value = ""; setTimeout(function () { pin.focus(); }, 50);
  }
  async function initSupa() {
    state.mode = "supa";
    store.sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false } });
    // Not awaited: the lock screen can show immediately, and ACCOUNTS only matters as
    // the fallback path's ingredient list (see unlock() below) — by the time someone
    // actually types a code this has almost always already finished in the background.
    loadAccountsList();
    showLock("");
  }
  // One request to a server-side Edge Function that tries the code against every
  // account itself (with the service-role key) and returns ready session tokens —
  // replaces the old N-sequential-signInWithPassword-calls loop with a single round
  // trip, and enforces the shared 5-attempts/15-minute lockout server-side. If the
  // function isn't deployed yet (404) or a network error happens, unlock() below
  // falls straight back to the old per-account loop, so login keeps working either
  // way — this is safe to ship ahead of deploying masar-login.
  var MASAR_LOGIN_FN_URL = CFG.url + "/functions/v1/masar-login";
  async function tryFastLogin(code) {
    try {
      var res = await fetch(MASAR_LOGIN_FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": CFG.key },
        body: JSON.stringify({ code: code })
      });
      if (res.status === 404) return { unavailable: true };
      var j = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        if (j && j.locked) return { locked: true, retryMin: j.retryMin };
        if (j && j.banned) return { banned: true };
        return { invalid: true };
      }
      return { ok: true, data: j };
    } catch (e) { return { unavailable: true }; }
  }
  async function unlock(code) {
    var btn = $("#pinbtn"); btn.disabled = true; $("#lockmsg").textContent = "";
    if (!/^\d{4,8}$/.test(code)) { $("#lockmsg").textContent = "الرمز غير صحيح"; btn.disabled = false; return; }
    try {
      var matched = null;
      var fast = await tryFastLogin(code);
      if (fast.locked) {
        $("#lockmsg").textContent = "محاولات كتير غلط — حاول تاني بعد " + (fast.retryMin || 15) + " دقيقة.";
        btn.disabled = false; return;
      }
      if (fast.banned) {
        $("#lockmsg").textContent = "تم إيقاف هذا الحساب، تواصل مع المسؤول.";
        btn.disabled = false; return;
      }
      if (fast.ok) {
        var setRes = await store.sb.auth.setSession({ access_token: fast.data.access_token, refresh_token: fast.data.refresh_token });
        if (setRes.error) { $("#lockmsg").textContent = "تعذّر الدخول: " + setRes.error.message; btn.disabled = false; return; }
        matched = { acc: fast.data.acc, uid: fast.data.acc.uid };
      }
      // fast.invalid and fast.unavailable (masar-login not deployed, broken/misconfigured
      // on the server, or a network hiccup) both fall through to the original per-account
      // signInWithPassword loop below, instead of trusting the Edge Function's "invalid"
      // verdict outright — a server-side bug there must never be able to lock every
      // account out of every correct PIN. Only if THIS direct path also fails to match
      // do we tell the person the code itself is wrong.
      if (!matched) {
        if (!ACCOUNTS.length) await loadAccountsList();
        var pass = CFG.prefix + code, lastErrMsg = "", banned = false;
        for (var i = 0; i < ACCOUNTS.length; i++) {
          var r = await store.sb.auth.signInWithPassword({ email: ACCOUNTS[i].email, password: pass });
          if (!r.error) { matched = { acc: ACCOUNTS[i], uid: r.data.user.id }; break; }
          var em = r.error.message || "";
          if (/banned/i.test(em)) { banned = true; break; }
          lastErrMsg = em;
        }
        if (banned) {
          $("#lockmsg").textContent = "تم إيقاف هذا الحساب، تواصل مع المسؤول.";
          btn.disabled = false; return;
        }
        if (!matched) {
          $("#lockmsg").textContent = /invalid login/i.test(lastErrMsg) ? "الرمز غير صحيح" : "تعذّر الدخول: " + lastErrMsg;
          btn.disabled = false; return;
        }
      }
      store.uid = matched.uid;
      $("#pin").value = "";
      if (matched.acc.role === "admin") {
        resetPermissions(); // the admin is never restricted — always sees everything
        btn.textContent = "جارٍ التحميل…";
        if (!ACCOUNTS.length) await loadAccountsList(); // the dashboard itself still needs the full roster
        await loadAdminDashboard();
        $("#lock").hidden = true; btn.textContent = "دخول";
        btn.disabled = false;
        return;
      }
      applyPermissions(matched.acc);
      btn.textContent = "جارٍ التحميل…";
      // Keep the lock screen up until the real data has actually arrived, instead of
      // revealing the app shell's empty starting values (0 prayers, level 1, ...) for
      // the second or two the fetch takes — that brief flash of an empty-looking
      // account is what used to look like the page "switching" right after login.
      await loadSupa(true);
      $("#lock").hidden = true; btn.textContent = "دخول";
      clearInterval(store.poll); store.poll = setInterval(function () { if (!document.hidden) loadSupa(false); }, 60000);
    } catch (e) { $("#lockmsg").textContent = "تعذّر الاتصال. تحقق من الإنترنت."; }
    btn.disabled = false;
  }


  /* ---------------- pager sync ---------------- */
  // Uses IntersectionObserver (not scrollLeft math) so it works regardless of how a
  // browser signs scrollLeft in an RTL container (this differs across engines and was
  // the root cause of the active tab not updating on a manual swipe).
  (function () {
    var pager = $("#pager");
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.intersectionRatio >= 0.55) {
            var t = en.target.id.replace("p-", "");
            if (t && t !== state.tab) { state.tab = t; markTabs(); }
          }
        });
      }, { root: pager, threshold: [0.55] });
      TABS.forEach(function (t) { var el = $("#p-" + t); if (el) io.observe(el); });
    } else {
      var tm;
      pager.addEventListener("scroll", function () {
        clearTimeout(tm);
        tm = setTimeout(function () {
          var max = pager.scrollWidth - pager.clientWidth;
          if (max <= 0) return;
          var frac = Math.abs(pager.scrollLeft) / max;
          var i = Math.round(frac * (TABS.length - 1)), t = TABS[i];
          if (t && t !== state.tab) { state.tab = t; markTabs(); }
        }, 90);
      }, { passive: true });
    }
  })();

