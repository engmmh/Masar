"use strict";
  /* ---------------- prayer tools: tasbih + qibla ---------------- */
  var KAABA = { lat: 21.4225, lng: 39.8262 };
  var TASBIH_PRESETS = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "أستغفر الله", "اللهم صلِّ على محمد"];
  var TASBIH_TARGETS = [33, 100, 1000, 0];

  function toolsEntryCardHTML() {
    return '<div class="card"><h3>أدوات</h3><p class="muted" style="font-size:14px;margin-block:4px 10px">السبحة الإلكترونية واتجاه القبلة</p><div class="row wrapr">' +
      '<button class="btn" data-act="tool-open" data-k="tasbih">' + ic("beads") + ' السبحة</button>' +
      '<button class="btn alt" data-act="tool-open" data-k="qibla">' + ic("compass") + ' القبلة</button></div></div>';
  }

  function tasbihState() {
    var t = state.settings.tasbih;
    if (!t || typeof t !== "object") t = state.settings.tasbih = { dhikr: 0, count: 0, target: 33, total: 0 };
    return t;
  }
  function tasbihHTML() {
    var t = tasbihState(), target = t.target || 0;
    var pct = target ? Math.min(100, Math.round(t.count / target * 100)) : 0;
    return '<button class="linkbtn" data-act="tool-close">← رجوع</button>' +
      '<div class="card"><div class="row between"><h2 style="margin:0">السبحة</h2><span class="chip">الإجمالي ' + t.total + '</span></div>' +
      '<div class="row wrapr" style="margin-block:12px">' + TASBIH_PRESETS.map(function (d, i) {
        return '<button class="chipbtn' + (t.dhikr === i ? " on" : "") + '" data-act="tasbih-dhikr" data-v="' + i + '">' + esc(d) + "</button>";
      }).join("") + "</div>" +
      '<button class="tasbih-btn" data-act="tasbih-tap" aria-label="تسبيحة" style="--p:' + pct + '">' +
      '<span class="tasbih-n num">' + t.count + "</span>" +
      '<span class="tasbih-d">' + esc(TASBIH_PRESETS[t.dhikr] || TASBIH_PRESETS[0]) + "</span>" +
      '<span class="muted">' + (target ? "من " + target : "بدون هدف") + "</span></button>" +
      '<div class="row wrapr" style="margin-block-start:12px;justify-content:center">' + TASBIH_TARGETS.map(function (n) {
        return '<button class="chipbtn' + (target === n ? " on" : "") + '" data-act="tasbih-target" data-v="' + n + '">' + (n ? n : "∞") + "</button>";
      }).join("") + '<button class="chipbtn" data-act="tasbih-reset">تصفير</button></div></div>';
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

  /* ---------------- backup (export / import) ---------------- */
  function backupCardHTML() {
    return '<div class="card"><h3 style="margin:0 0 6px">نسخة احتياطية</h3><p class="muted" style="font-size:13px;margin-block-end:10px">نزّل كل بياناتك (الصلاة، القرآن، الكورسات، المصروفات) في ملف، وترجّعها وقت ما تحب.</p>' +
      '<div class="row wrapr"><button class="btn sm" data-act="backup-export">' + ic("download") + ' تصدير</button>' +
      '<button class="btn sm alt" data-act="backup-import">⬆️ استيراد</button></div>' +
      '<input type="file" id="backupFile" accept="application/json,.json" hidden></div>';
  }
  function exportBackup() {
    var data = { app: "masar", version: 1, at: new Date().toISOString(), settings: state.settings, days: state.days, learn: state.learn, exp: state.exp };
    var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "masar-backup-" + nowR().key + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000);
    toast("تم تصدير النسخة الاحتياطية.");
  }
  function importBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var o;
      try { o = JSON.parse(reader.result); } catch (e) { toast("الملف ده مش نسخة احتياطية صالحة."); return; }
      if (!o || o.app !== "masar" || typeof o.days !== "object") { toast("الملف ده مش نسخة احتياطية من مسار."); return; }
      if (!confirm("الاستيراد هيستبدل بياناتك الحالية بالنسخة اللي في الملف. متأكد؟")) return;
      if (o.settings) state.settings = Object.assign(state.settings, o.settings);
      if (o.learn) state.learn = Object.assign(state.learn, o.learn);
      if (o.exp) state.exp = Object.assign(state.exp, o.exp);
      state.days = o.days || {};
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
        t.count++; t.total++;
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
      case "backup-import": var f = document.getElementById("backupFile"); if (f) { f.value = ""; f.click(); } break;
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "backupFile" && e.target.files && e.target.files[0]) importBackup(e.target.files[0]);
  });
