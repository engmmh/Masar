"use strict";
  /* ---------------- prayer tools: tasbih + qibla ---------------- */
  var KAABA = { lat: 21.4225, lng: 39.8262 };
  var TASBIH_PRESETS = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "أستغفر الله", "اللهم صلِّ على محمد"];
  var TASBIH_TARGETS = [33, 100, 1000, 0];



  // Daily counts per dhikr: t.today = {presetIndex: count} for t.day; when a new day
  // starts, yesterday's counts move into the archive t.log[day] (last 120 days kept)
  // and today's start from zero. t.total stays the all-time total.
  function tasbihState() {
    var t = state.settings.tasbih;
    if (!t || typeof t !== "object") t = state.settings.tasbih = { dhikr: 0, count: 0, target: 33, total: 0 };
    if (!t.today || typeof t.today !== "object") t.today = {};
    if (!t.log || typeof t.log !== "object") t.log = {};
    var k = nowR().key;
    if (t.day !== k) {
      if (t.day && tasbihSum(t.today) > 0) t.log[t.day] = t.today;
      var keys = Object.keys(t.log).sort(); while (keys.length > 120) delete t.log[keys.shift()];
      var had = !!t.day; t.day = k; t.today = {}; t.count = 0;
      if (had && state.loaded) saveMeta("settings", 800);
    }
    return t;
  }
  function tasbihSum(o) { return Object.keys(o || {}).reduce(function (a, i) { return a + (Number(o[i]) || 0); }, 0); }
  function tasbihBreakdown(o, cls) {
    return Object.keys(o || {}).filter(function (i) { return o[i] > 0; }).sort(function (a, b) { return o[b] - o[a]; }).map(function (i) {
      return '<span class="' + cls + '">' + esc(TASBIH_PRESETS[i] || "ذكر") + ' <b class="num">' + o[i] + "</b></span>";
    }).join("");
  }
  function tasbihHTML() {
    var t = tasbihState(), target = t.target || 0;
    var pct = target ? Math.min(100, Math.round(t.count / target * 100)) : 0, todaySum = tasbihSum(t.today);
    var days = Object.keys(t.log).sort().reverse();
    var arch = days.length ? '<details class="card tb-arch"><summary><b>الأرشيف</b><span class="muted">' + days.length + " يوم</span></summary>" +
      days.slice(0, 60).map(function (k) {
        return '<div class="tb-day"><div class="row between"><span>' + esc(greg(k)) + '</span><b class="num">' + tasbihSum(t.log[k]) + "</b></div>" +
          '<div class="tb-break">' + tasbihBreakdown(t.log[k], "tb-chip") + "</div></div>";
      }).join("") + "</details>" : "";
    return '<button class="linkbtn" data-act="tool-close">← رجوع</button>' +
      '<div class="card"><div class="row between"><h2 style="margin:0">السبحة</h2><span class="chip">النهارده <b class="num">' + todaySum + "</b></span></div>" +
      '<div class="row wrapr" style="margin-block:12px">' + TASBIH_PRESETS.map(function (d, i) {
        var n = t.today[i] || 0;
        return '<button class="chipbtn' + (t.dhikr === i ? " on" : "") + '" data-act="tasbih-dhikr" data-v="' + i + '">' + esc(d) + (n ? ' <span class="tb-n num">' + n + "</span>" : "") + "</button>";
      }).join("") + "</div>" +
      '<button class="tasbih-btn" data-act="tasbih-tap" aria-label="تسبيحة" style="--p:' + pct + '">' +
      '<span class="tasbih-n num">' + t.count + "</span>" +
      '<span class="tasbih-d">' + esc(TASBIH_PRESETS[t.dhikr] || TASBIH_PRESETS[0]) + "</span>" +
      '<span class="muted">' + (target ? "من " + target : "بدون هدف") + "</span></button>" +
      '<div class="row wrapr" style="margin-block-start:12px;justify-content:center">' + TASBIH_TARGETS.map(function (n) {
        return '<button class="chipbtn' + (target === n ? " on" : "") + '" data-act="tasbih-target" data-v="' + n + '">' + (n ? n : "∞") + "</button>";
      }).join("") + '<button class="chipbtn" data-act="tasbih-reset">تصفير</button></div>' +
      '<p class="muted tb-note">«تصفير» بيصفّر العدّاد اللي قدامك بس — عدد النهارده بيفضل محسوب.</p></div>' +
      '<div class="card"><div class="row between"><h3 style="margin:0">ذِكر النهارده</h3><b class="num">' + todaySum + "</b></div>" +
      (todaySum ? '<div class="tb-break">' + tasbihBreakdown(t.today, "tb-chip") + "</div>" : '<p class="muted tb-note">لسه مفيش — اختار ذكر واضغط على الدايرة.</p>') +
      '<p class="muted tb-note">بيتصفّر مع أول اليوم الجديد ويتحفظ في الأرشيف. الإجمالي من أول ما بدأت: <b class="num">' + (t.total || 0) + "</b></p></div>" + arch;
  }

  function qiblaBearing() {
    var r = Math.PI / 180, p1 = LAT * r, p2 = KAABA.lat * r, dl = (KAABA.lng - LNG) * r;
    var y = Math.sin(dl), x = Math.cos(p1) * Math.tan(p2) - Math.sin(p1) * Math.cos(dl);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  function kaabaDistanceKm() {
    var r = Math.PI / 180, dLat = (KAABA.lat - LAT) * r, dLng = (KAABA.lng - LNG) * r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(LAT * r) * Math.cos(KAABA.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  function qiblaHTML() {
    var b = qiblaBearing();
    return '<button class="linkbtn" data-act="tool-close">← رجوع</button>' +
      '<div class="card" style="text-align:center"><h2 style="margin:0 0 4px">اتجاه القبلة</h2>' +
      '<p class="muted" style="font-size:14px;margin:0 0 14px">' + esc(LOC_NAME) + " · " + Math.round(b) + "° من الشمال · " + kaabaDistanceKm().toLocaleString("en-US") + " كم عن الكعبة</p>" +
      '<div class="qibla-dial" id="qiblaDial"><span class="qibla-n">N</span>' +
      '<div class="qibla-needle" style="transform:rotate(' + b + 'deg)"><span>🕋</span></div></div>' +
      '<p class="muted" id="qiblaMsg" style="font-size:13px;margin-block:14px 10px">' +
      (compassOn ? "حرّك الموبايل لحد ما الكعبة تبقى فوق." : "البوصلة بتلف مع اتجاه الموبايل بعد التفعيل. من غيرها، الشمال فوق.") + "</p>" +
      (compassOn ? "" : '<button class="btn" data-act="qibla-compass">تفعيل البوصلة</button>') +
      '<p class="muted" style="font-size:12px;margin-block-start:10px">غيّر موقعك من الإعدادات ← الموقع.</p></div>';
  }
  var compassOn = false;
  function onOrientation(e) {
    var heading = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading
      : (e.absolute && typeof e.alpha === "number") ? 360 - e.alpha : null;
    if (heading == null) return;
    var dial = document.getElementById("qiblaDial");
    if (dial) dial.style.transform = "rotate(" + (-heading) + "deg)";
  }
  async function startCompass() {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        if (await DeviceOrientationEvent.requestPermission() !== "granted") { toast("محتاج إذن الحساسات عشان البوصلة."); return; }
      }
      if (!("ondeviceorientationabsolute" in window) && !("ondeviceorientation" in window)) { toast("الجهاز ده مفيهوش بوصلة."); return; }
      window.addEventListener("ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation", onOrientation);
      compassOn = true; render();
    } catch (e) { toast("تعذّر تشغيل البوصلة."); }
  }

  /* ---------------- location (prayer times + qibla) ---------------- */
  var CITY_PRESETS = [
    { name: "الرياض", lat: 24.7136, lng: 46.6753, tz: 3, tzName: "Asia/Riyadh", calc: "umm" },
    { name: "مكة", lat: 21.3891, lng: 39.8579, tz: 3, tzName: "Asia/Riyadh", calc: "umm" },
    { name: "المدينة", lat: 24.5247, lng: 39.5692, tz: 3, tzName: "Asia/Riyadh", calc: "umm" },
    { name: "جدة", lat: 21.4858, lng: 39.1925, tz: 3, tzName: "Asia/Riyadh", calc: "umm" },
    { name: "الدمام", lat: 26.4207, lng: 50.0888, tz: 3, tzName: "Asia/Riyadh", calc: "umm" },
    { name: "القاهرة", lat: 30.0444, lng: 31.2357, tz: 2, tzName: "Africa/Cairo", calc: "egypt" },
    { name: "الإسكندرية", lat: 31.2001, lng: 29.9187, tz: 2, tzName: "Africa/Cairo", calc: "egypt" }
  ];
  function locationCardHTML() {
    return '<div class="card"><h3 style="margin:0 0 6px">الموقع</h3><p class="muted" style="font-size:13px;margin-block-end:10px">مواقيت الصلاة واتجاه القبلة محسوبين لـ <b>' + esc(LOC_NAME) +
      "</b> (" + (CALC === "egypt" ? "الهيئة المصرية" : "أم القرى") + ").</p>" +
      '<div class="row wrapr">' + CITY_PRESETS.map(function (c, i) {
        return '<button class="chipbtn' + (LOC_NAME === c.name ? " on" : "") + '" data-act="loc-city" data-v="' + i + '">' + esc(c.name) + "</button>";
      }).join("") + '<button class="chipbtn" data-act="loc-gps">' + ic("pin") + ' موقعي الحالي</button></div></div>';
  }
  function saveLocation(loc) {
    try { localStorage.setItem("masar:loc", JSON.stringify(loc)); } catch (e) { toast("تعذّر حفظ الموقع."); return; }
    // LAT/LNG/TZ are read once at startup and prayer schedules are cached, so reload.
    location.reload();
  }
  function useGps() {
    if (!navigator.geolocation) { toast("المتصفح مش بيدعم تحديد الموقع."); return; }
    toast("جاري تحديد موقعك…");
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      // Egypt roughly: lat 22–31.7, lng 25–35 → Egyptian authority method.
      var inEgypt = lat > 22 && lat < 31.8 && lng > 24.7 && lng < 35;
      saveLocation({ name: "موقعي", lat: lat, lng: lng, tz: -new Date().getTimezoneOffset() / 60, tzName: Intl.DateTimeFormat().resolvedOptions().timeZone, calc: inEgypt ? "egypt" : "umm" });
    }, function () { toast("تعذّر تحديد الموقع. اسمح للموقع بالوصول أو اختار مدينة."); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 });
  }

  /* ---------------- recover from this device's local copy ----------------
     When the app ever ran in local mode on this phone (cloud unreachable), it kept a full
     copy in localStorage ("masar:v1"). If that copy holds progress the cloud account no
     longer has, offer to merge it back: empty parts take the device's copy, filled parts
     are merged (cloud wins on conflicts), XP takes the larger. */
  function devCopy() { try { var o = JSON.parse(localStorage.getItem("masar:v1") || "null"); return o && o.learn ? o : null; } catch (e) { return null; } }
  function learnScore(L) {
    if (!L) return { units: 0, fit: 0, hz: 0, dose: 0, xp: 0, acts: 0 };
    var units = Object.keys(L.units || {}).filter(function (k) { return L.units[k] && L.units[k].done; }).length;
    var hz = ((L.hifz && L.hifz.mem) || []).reduce(function (t, r) { return t + (r[1] - r[0] + 1); }, 0);
    return { units: units, fit: L.fit && L.fit.prof ? 1 : 0, hz: hz, dose: Object.keys((L.coach && L.coach.days) || {}).length, xp: L.xp || 0, acts: ((L.fit && L.fit.acts) || []).length };
  }
  function isEmptyVal(v) { return v == null || v === 0 || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length); }
  function recoverCardHTML() {
    if (state.mode !== "supa") return "";
    var d = devCopy(); if (!d) return "";
    var a = learnScore(d.learn), b = learnScore(state.learn);
    if (!(a.units > b.units || (a.fit && !b.fit) || a.hz > b.hz || a.dose > b.dose || a.xp > b.xp || a.acts > b.acts)) return "";
    var bits = [];
    if (a.units) bits.push(a.units + " وحدة خلصتها"); if (a.fit) bits.push("خطة التمارين"); if (a.acts) bits.push(a.acts + " تمرين");
    if (a.hz) bits.push(a.hz + " آية محفوظة"); if (a.dose) bits.push(a.dose + " يوم في مساري"); if (a.xp) bits.push(a.xp + " نقطة");
    return '<div class="card push-allow"><h3 style="margin:0 0 4px">' + ic("refresh") + ' نسخة قديمة على الجهاز ده</h3><p class="muted" style="font-size:13px">لقيت على الموبايل ده نسخة محفوظة فيها: ' + esc(bits.join("، ")) +
      '. تقدر ترجّعها لحسابك — اللي موجود دلوقتي مش هيتمسح.</p><button class="btn sm" style="margin-block-start:8px" data-act="recover-dev">رجّعها</button></div>';
  }
  function recoverFromDevice() {
    var d = devCopy(); if (!d) return;
    if (!confirm("ترجّع البيانات اللي على الجهاز ده لحسابك؟")) return;
    var L = state.learn, D = d.learn;
    Object.keys(D).forEach(function (k) {
      if (k === "__proto__" || k === "constructor") return;
      if (k === "xp") { L.xp = Math.max(L.xp || 0, D.xp || 0); return; }
      if (isEmptyVal(L[k])) L[k] = D[k];
      else if (L[k] && D[k] && typeof L[k] === "object" && typeof D[k] === "object" && !Array.isArray(L[k])) L[k] = Object.assign({}, D[k], L[k]);
    });
    if (d.food && isEmptyVal((state.food || {}).days)) { state.food = Object.assign(freshFood(), d.food); saveMeta("food", 0); }
    saveMeta("learn", 0); render(); toast("رجعت البيانات ✓");
  }

  /* ---------------- backup (export / import) ---------------- */
  function backupCardHTML() {
    return '<div class="card"><h3 style="margin:0 0 6px">نسخة احتياطية</h3><p class="muted" style="font-size:13px;margin-block-end:10px">نزّل كل بياناتك (الصلاة، القرآن، الكورسات، المصروفات) في ملف، وترجّعها وقت ما تحب.</p>' +
      '<div class="row wrapr"><button class="btn sm" data-act="backup-export">' + ic("download") + ' تصدير</button>' +
      '<button class="btn sm alt" data-act="backup-import">⬆️ استيراد</button></div>' +
      '<input type="file" id="backupFile" accept="application/json,.json" hidden></div>';
  }
  function exportBackup() {
    var data = { app: "masar", version: 1, at: new Date().toISOString(), settings: state.settings, days: state.days, learn: state.learn, exp: state.exp, food: state.food };
    var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "masar-backup-" + nowR().key + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000);
    toast("تم تصدير النسخة الاحتياطية.");
  }
  // A backup file is untrusted input: size-capped, prototype keys stripped at every
  // depth, and each part type-checked before anything is merged into the app's state.
  var BACKUP_MAX_BYTES = 10 * 1024 * 1024;
  function isPlainObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function cleanBackup(v, depth) {
    if (depth > 12) return undefined;
    if (Array.isArray(v)) return v.slice(0, 5000).map(function (x) { return cleanBackup(x, depth + 1); });
    if (isPlainObj(v)) {
      var out = {};
      Object.keys(v).forEach(function (k) { if (k === "__proto__" || k === "constructor" || k === "prototype") return; var c = cleanBackup(v[k], depth + 1); if (c !== undefined) out[k] = c; });
      return out;
    }
    if (typeof v === "string") return v.slice(0, 20000);
    if (typeof v === "number") return isFinite(v) ? v : 0;
    if (typeof v === "boolean" || v === null) return v;
    return undefined;
  }
  function importBackup(file) {
    if (file.size > BACKUP_MAX_BYTES) { toast("الملف كبير أوي — ده مش نسخة احتياطية من مسار."); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var o;
      try { o = cleanBackup(JSON.parse(reader.result), 0); } catch (e) { toast("الملف ده مش نسخة احتياطية صالحة."); return; }
      if (!isPlainObj(o) || o.app !== "masar" || !isPlainObj(o.days)) { toast("الملف ده مش نسخة احتياطية من مسار."); return; }
      var days = {};
      Object.keys(o.days).forEach(function (k) { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && isPlainObj(o.days[k])) days[k] = o.days[k]; });
      if (!confirm("الاستيراد هيستبدل بياناتك الحالية بالنسخة اللي في الملف. متأكد؟")) return;
      if (isPlainObj(o.settings)) state.settings = Object.assign(state.settings, o.settings);
      if (isPlainObj(o.learn)) state.learn = Object.assign(state.learn, o.learn);
      if (isPlainObj(o.exp)) state.exp = Object.assign(state.exp, o.exp);
      if (isPlainObj(o.food)) { state.food = Object.assign(freshFood(), o.food); saveMeta("food", 0); }
      state.days = days;
      Object.keys(state.days).forEach(function (k) { saveDay(k, 0); });
      saveMeta("settings", 0); saveMeta("learn", 0); saveMeta("exp", 0);
      render(); toast("تم استيراد النسخة الاحتياطية.");
    };
    reader.readAsText(file);
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    switch (el.getAttribute("data-act")) {
      case "tool-open": state.tool = el.getAttribute("data-k"); $("#p-prayer").scrollTop = 0; render(); break;
      case "tool-close": state.tool = null; render(); break;
      case "tasbih-tap": {
        var t = tasbihState();
        t.count++; t.total++; t.today[t.dhikr] = (t.today[t.dhikr] || 0) + 1;
        if (t.target && t.count === t.target) { if (navigator.vibrate) navigator.vibrate([60, 60, 60]); toast("أتممت " + t.target + " ✨"); }
        else if (navigator.vibrate) navigator.vibrate(12);
        saveMeta("settings", 1500); render(); break;
      }
      case "tasbih-dhikr": tasbihState().dhikr = Number(el.getAttribute("data-v")) || 0; tasbihState().count = 0; saveMeta("settings", 400); render(); break;
      case "tasbih-target": tasbihState().target = Number(el.getAttribute("data-v")) || 0; saveMeta("settings", 400); render(); break;
      case "tasbih-reset": tasbihState().count = 0; saveMeta("settings", 400); render(); break;
      case "qibla-compass": startCompass(); break;
      case "loc-city": var c = CITY_PRESETS[Number(el.getAttribute("data-v"))]; if (c) saveLocation(c); break;
      case "loc-gps": useGps(); break;
      case "backup-export": exportBackup(); break;
      case "recover-dev": recoverFromDevice(); break;
      case "backup-import": var f = document.getElementById("backupFile"); if (f) { f.value = ""; f.click(); } break;
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "backupFile" && e.target.files && e.target.files[0]) importBackup(e.target.files[0]);
  });
