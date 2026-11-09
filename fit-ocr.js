"use strict";
  /* ---------------- قراءة صورة تمرين (OCR) ----------------
     Reads a workout screenshot from a watch / phone app (distance, duration, pace,
     calories, date) on the device itself with Tesseract (self-hosted under
     vendor/tesseract, loaded only the first time it's used). The image is never
     uploaded or stored — only the numbers the person confirms are saved. */
  var FX_TESS = null;
  function fxLoadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    if (FX_TESS) return FX_TESS;
    FX_TESS = new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = "vendor/tesseract/tesseract.min.js";
      s.onload = function () { ok(); }; s.onerror = function () { FX_TESS = null; bad(new Error("load")); };
      document.head.appendChild(s);
    });
    return FX_TESS;
  }
  // Big, high-contrast, dark-on-light: workout screens are usually light text on black.
  function fxPrepare(file) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var sc = Math.min(3, Math.max(1, 1800 / Math.max(img.width, img.height)));
        var w = Math.round(img.width * sc), h = Math.round(img.height * sc);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        var d = x.getImageData(0, 0, w, h), p = d.data, sum = 0, i;
        for (i = 0; i < p.length; i += 4) { var g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; p[i] = g; sum += g; }
        var inv = sum / (p.length / 4) < 120;
        for (i = 0; i < p.length; i += 4) {
          var v = inv ? 255 - p[i] : p[i];
          v = Math.max(0, Math.min(255, (v - 40) * 1.5));
          p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255;
        }
        x.putImageData(d, 0, 0); ok(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); bad(new Error("image")); };
      img.src = url;
    });
  }
  function fxRecognize(file, onProgress) {
    return fxLoadTesseract().then(function () { return fxPrepare(file); }).then(function (canvas) {
      return Tesseract.createWorker("eng", 1, {
        workerPath: "vendor/tesseract/worker.min.js", corePath: "vendor/tesseract/core", langPath: "vendor/tesseract/lang",
        workerBlobURL: false, logger: function (m) { if (onProgress && m && typeof m.progress === "number") onProgress(m.status, m.progress); }
      }).then(function (worker) {
        return worker.recognize(canvas).then(function (r) { worker.terminate(); return r.data.text || ""; }, function (e) { worker.terminate(); throw e; });
      });
    });
  }

  /* -------- turning the recognized text into numbers -------- */
  var FX_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  function fxParse(text) {
    var t = String(text || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[’′`´]/g, "'").replace(/[”″“]/g, '"').replace(/\r/g, "");
    var flat = t.replace(/\s+/g, " "), out = { km: null, sec: null, pace: null, kcal: null, date: null, time: null };
    // distance: "2.59 km" (also "2.59km", miles converted)
    var m = /(\d{1,3}[.,]\d{1,2})\s*(km|كم|kilometers?)\b/i.exec(flat) || /(\d{1,3}[.,]\d{1,2})\s*(mi|miles?)\b/i.exec(flat);
    if (m) { var dv = parseFloat(m[1].replace(",", ".")); out.km = /^mi/i.test(m[2]) ? Math.round(dv * 1.609344 * 100) / 100 : dv; }
    // duration: h:mm:ss anywhere; else mm:ss near a duration label
    m = /\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/.exec(flat);
    if (m) out.sec = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    else {
      m = /(duration|time|workout time|المدة|الوقت)\D{0,12}(\d{1,3}):([0-5]\d)\b/i.exec(flat);
      if (m) out.sec = Number(m[2]) * 60 + Number(m[3]);
    }
    // pace: 10'40" (min'sec per km)
    m = /\b(\d{1,2})\s*'\s*([0-5]\d)\s*("|''|')?/.exec(flat);
    if (m) out.pace = Number(m[1]) * 60 + Number(m[2]);
    // calories
    m = /(\d{2,4})\s*(kcal|cal|calories|سعر)/i.exec(flat);
    if (m) out.kcal = Number(m[1]);
    // date + time: "November 9, 2026 at 5:27 AM" / "9 Nov 2026" / "2026-11-09"
    m = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i.exec(flat);
    if (m) out.date = m[3] + "-" + pad(FX_MONTHS.indexOf(m[1].toLowerCase()) + 1) + "-" + pad(Number(m[2]));
    else if ((m = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})/i.exec(flat))) out.date = m[3] + "-" + pad(FX_MONTHS.indexOf(m[2].toLowerCase()) + 1) + "-" + pad(Number(m[1]));
    else if ((m = /\b(20\d\d)[-/.](\d{1,2})[-/.](\d{1,2})\b/.exec(flat))) out.date = m[1] + "-" + pad(Number(m[2])) + "-" + pad(Number(m[3]));
    m = /\b(\d{1,2}):([0-5]\d)\s*(am|pm)\b/i.exec(flat);
    if (m) { var hh = Number(m[1]) % 12 + (/pm/i.test(m[3]) ? 12 : 0); out.time = pad(hh) + ":" + m[2]; }
    // last resort for distance: the first decimal number on the screen (the big headline)
    if (!out.km && !out.pace) { m = /\b(\d{1,2}[.,]\d{1,2})\b/.exec(flat); if (m) out.km = parseFloat(m[1].replace(",", ".")); }
    // fill the third of distance / duration / pace from the other two
    if (out.km && out.pace && !out.sec) out.sec = Math.round(out.km * out.pace);
    if (out.sec && out.pace && !out.km) out.km = Math.round(out.sec / out.pace * 100) / 100;
    return out;
  }

  /* -------- what the numbers mean -------- */
  // Pace in seconds per km → kind of movement (thresholds in the plan: >10 normal walk,
  // 8.5–10 brisk walk, 6.5–8.5 easy jog, <6.5 run).
  function fxKind(paceSec) {
    var m = paceSec / 60;
    if (m > 10) return { k: "walk", t: "مشي عادي" };
    if (m > 8.5) return { k: "brisk", t: "مشي سريع" };
    if (m > 6.5) return { k: "jog", t: "جري خفيف" };
    return { k: "run", t: "جري" };
  }
  // ACSM equations (gross): walking VO2 = 0.1·speed + 3.5, running 0.2·speed + 3.5
  // (ml/kg/min, speed in m/min); ~5 kcal per litre of oxygen.
  function fxKcal(km, sec, kg) {
    if (!(km > 0 && sec > 0 && kg > 0)) return 0;
    var min = sec / 60, speed = km * 1000 / min, run = speed >= 134;
    var vo2 = (run ? 0.2 : 0.1) * speed + 3.5;
    return Math.round(vo2 * kg / 1000 * 5 * min);
  }
  function fxPaceTxt(paceSec) { paceSec = Math.round(paceSec); return Math.floor(paceSec / 60) + ":" + pad(paceSec % 60); }
  function fxDurTxt(sec) { sec = Math.round(sec); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ":" + pad(m) : m) + ":" + pad(s); }
  function fxParseDur(s) {
    var p = String(s || "").trim().split(":").map(Number);
    if (p.some(function (x) { return !isFinite(x); }) || !p.length) return 0;
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 60;
  }
