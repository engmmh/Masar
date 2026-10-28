"use strict";
  /* ---------------- القرآن: reader, recitation, search, khatma plan ---------------- */
  // Recitation streams one ayah at a time from public Quran audio CDNs (the
  // islamic.network mirror first, everyayah.com as fallback), so nothing large
  // ships with the app. Ayah text always comes from quran/quran.json.
  var RECITERS = [
    { k: "alafasy", n: "مشاري العفاسي", a: "128/ar.alafasy", b: "Alafasy_128kbps" },
    { k: "husary", n: "محمود خليل الحصري", a: "128/ar.husary", b: "Husary_128kbps" },
    { k: "minshawi", n: "محمد صديق المنشاوي", a: "128/ar.minshawi", b: "Minshawy_Murattal_128kbps" },
    { k: "abdulbasit", n: "عبد الباسط عبد الصمد", a: "192/ar.abdulbasitmurattal", b: "Abdul_Basit_Murattal_192kbps" },
    { k: "maher", n: "ماهر المعيقلي", a: "128/ar.mahermuaiqly", b: "MaherAlMuaiqly128kbps" }
  ];
  var QA = { on: false, playing: false, queue: [], i: 0, repLeft: 0, fallback: false, mode: "page" };
  var qaAudio = null, AYAH_OFFSET = null;
  function qSet() { var S = state.settings; if (!S.qFont) S.qFont = 26; if (!S.qRec) S.qRec = "alafasy"; if (!S.qRep) S.qRep = 1; if (!Array.isArray(S.qMarks)) S.qMarks = []; return S; }
  function globalAyah(s, a) {
    if (!AYAH_OFFSET) { AYAH_OFFSET = [0]; QURAN.surahs.forEach(function (x, i) { AYAH_OFFSET[i + 1] = AYAH_OFFSET[i] + x.ayahCount; }); }
    return AYAH_OFFSET[s - 1] + a;
  }
  function pad3(n) { return ("00" + n).slice(-3); }
  function reciter() { var k = qSet().qRec; return RECITERS.filter(function (r) { return r.k === k; })[0] || RECITERS[0]; }
  function ayahUrl(it, fallback) {
    var r = reciter();
    return fallback ? "https://everyayah.com/data/" + r.b + "/" + pad3(it.s) + pad3(it.a) + ".mp3"
      : "https://cdn.islamic.network/quran/audio/" + r.a + "/" + globalAyah(it.s, it.a) + ".mp3";
  }
  function surahName(s) { return QURAN.surahs[s - 1].name; }
  function qaPlay(queue, i, mode) {
    if (!qaAudio) {
      qaAudio = new Audio();
      qaAudio.addEventListener("ended", qaEnded);
      qaAudio.addEventListener("error", function () {
        if (!QA.fallback) { QA.fallback = true; qaLoad(); return; }
        QA.playing = false; render(); toast("تعذّر تشغيل التلاوة. اتأكد من الإنترنت.");
      });
    }
    QA.on = true; QA.queue = queue; QA.i = i || 0; QA.mode = mode || "page"; QA.repLeft = qSet().qRep;
    qaLoad();
  }
  function qaLoad() {
    var it = QA.queue[QA.i]; if (!it) { qaStop(); return; }
    qaAudio.src = ayahUrl(it, QA.fallback);
    var pr = qaAudio.play(); if (pr && pr.catch) pr.catch(function () { });
    QA.playing = true; render(); qaScroll();
  }
  function qaEnded() {
    QA.repLeft--;
    if (QA.repLeft > 0) { qaAudio.currentTime = 0; qaAudio.play(); return; }
    QA.repLeft = qSet().qRep; QA.fallback = false; QA.i++;
    if (QA.i < QA.queue.length) { qaLoad(); return; }
    if (QA.mode === "page" && state.qv && state.qv.page && state.qv.page < 604) {
      state.qv.page++; qaCountPage(state.qv.page - 1);
      QA.queue = pageAyahs(state.qv.page).map(function (v) { return { s: v.surah, a: v.ayah }; }); QA.i = 0;
      $("#p-quran").scrollTop = 0; qaLoad(); return;
    }
    qaStop(); toast("انتهت التلاوة");
  }
  function qaToggle() {
    if (!qaAudio || !QA.on) return;
    if (QA.playing) { qaAudio.pause(); QA.playing = false; } else { qaAudio.play(); QA.playing = true; }
    render();
  }
  function qaStop() { if (qaAudio) { qaAudio.pause(); qaAudio.removeAttribute("src"); } QA.on = false; QA.playing = false; QA.queue = []; render(); }
  function qaCur() { return QA.on ? QA.queue[QA.i] : null; }
  function qaScroll() {
    setTimeout(function () { var el = document.querySelector("#p-quran .ayah.playing"); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 80);
  }
  function qaBarHTML() {
    if (!QA.on) return "";
    var c = qaCur(), r = reciter();
    return '<div class="qa-bar"><div class="grow"><b>' + esc(r.n) + "</b><small>" + (c ? esc(surahName(c.s)) + " · آية " + arNum(c.a) : "") + "</small></div>" +
      '<button class="qa-btn" data-act="qa-toggle" aria-label="' + (QA.playing ? "إيقاف مؤقت" : "تشغيل") + '">' + (QA.playing ? "⏸" : "▶") + "</button>" +
      '<button class="qa-btn" data-act="qa-next" aria-label="الآية التالية">⏭</button>' +
      '<button class="qa-rep" data-act="qa-rep">🔁 ×' + qSet().qRep + "</button>" +
      '<button class="qa-btn x" data-act="qa-stop" aria-label="إيقاف">✕</button></div>';
  }

  /* reading progress */
  // Pages counted by the auto-counter today, so paging back and forth never
  // counts the same page twice.
  function qaCountPage(p) {
    var S = qSet(); if (!S.qAuto) return;
    var key = nowR().key, d = state.days[key] || (state.days[key] = {});
    if (!Array.isArray(d.qp)) d.qp = [];
    if (d.qp.indexOf(p) >= 0) return;
    d.qp.push(p); d.q = (d.q || 0) + 1; saveDay(key, 800);
  }
  function daysBetweenKeys(a, b) {
    var p = a.split("-").map(Number), q = b.split("-").map(Number);
    return Math.round((Date.UTC(q[0], q[1] - 1, q[2]) - Date.UTC(p[0], p[1] - 1, p[2])) / 864e5);
  }
  function readStreak(now) {
    var k = now.key, n = 0;
    if (!pagesOn(k)) k = addDays(k, -1);
    while (pagesOn(k) > 0 && n < 3000) { n++; k = addDays(k, -1); }
    return n;
  }
  function khatmaPos() { var S = state.settings, abs = (S.startPage - 1) + totalPages(); return { abs: abs, cur: (abs % 604) + 1 }; }
  function qWirdExtrasHTML(now) {
    var S = qSet(), pos = khatmaPos(), plan = S.qPlan, planHTML;
    if (plan && plan.days) {
      var elapsed = Math.max(0, daysBetweenKeys(plan.start, now.key)) + 1;
      // Judge against the pace due by the end of yesterday, so a fresh plan (or a
      // morning before today's reading) never shows as behind.
      var done = pos.abs - plan.startAbs, expected = Math.min(604, Math.round((elapsed - 1) * 604 / plan.days)), diff = done - expected;
      var daysLeft = Math.max(1, plan.days - elapsed + 1), perDay = Math.ceil(Math.max(0, 604 - done) / daysLeft), pct = Math.min(100, Math.round(done / 604 * 100));
      planHTML = '<div class="card"><div class="row between"><h3 style="margin:0">🎯 خطة الختمة</h3><button class="linkbtn" data-act="q-plan" data-v="0">إلغاء</button></div>' +
        '<p class="muted" style="font-size:13px;margin-block:4px 10px">ختمة في ' + plan.days + " يوم · اليوم " + Math.min(elapsed, plan.days) + " من " + plan.days + "</p>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="q-plan-st ' + (diff >= 0 ? "ok" : "late") + '">' + (done >= 604 ? "🎉 ختمت! تقبّل الله منك." : diff >= 0 ? "✓ ماشي على الخطة" + (diff > 0 ? " وسابقها بـ " + diff + " صفحة" : "") + " · المطلوب النهارده " + perDay + " صفحة" : "متأخر " + (-diff) + " صفحة — اقرأ " + perDay + " صفحة يوميًا عشان تلحق") + "</div></div>";
    } else {
      planHTML = '<div class="card"><h3 style="margin:0 0 4px">🎯 خطة ختمة</h3><p class="muted" style="font-size:13px;margin-block-end:10px">اختار هتختم في قد إيه، وأنا أحسبلك المطلوب كل يوم وأقولك لو اتأخرت.</p><div class="row wrapr" style="gap:6px">' +
        [[30, "شهر"], [60, "شهرين"], [90, "3 شهور"], [180, "6 شهور"], [365, "سنة"]].map(function (x) {
          return '<button class="chipbtn" data-act="q-plan" data-v="' + x[0] + '">' + x[1] + ' <small class="muted">(' + Math.ceil(604 / x[0]) + " ص/يوم)</small></button>";
        }).join("") + "</div></div>";
    }
    var heat = ""; for (var i = 29; i >= 0; i--) { var k = addDays(now.key, -i), v = pagesOn(k), t = target(); heat += '<i class="' + (v >= t ? "h3" : v > 0 ? "h1" : "") + '" title="' + esc(greg(k)) + ": " + v + ' صفحة"></i>'; }
    return '<button class="card q-continue" data-act="q-continue" data-p="' + pos.cur + '"><span class="q-continue-ic">📖</span><span class="grow"><b>كمّل القراءة</b><small class="muted">صفحة ' + arNum(pos.cur) + " · الجزء " + arNum(juzOf(pos.cur)) + "</small></span><span>←</span></button>" +
      planHTML +
      '<div class="card"><div class="row between"><h3 style="margin:0">آخر 30 يوم</h3><span class="chip">🔥 ' + readStreak(now) + " يوم متواصل</span></div><div class=\"q-heat\">" + heat + "</div>" +
      '<label class="q-auto"><input type="checkbox" data-act="q-auto"' + (S.qAuto ? " checked" : "") + '> احسب الصفحات تلقائي وأنا بقرأ من المصحف</label></div>';
  }

  /* search */
  var QIDX = null;
  function quranSearch(q) {
    if (!QIDX) { QIDX = []; QURAN.surahs.forEach(function (su, si) { su.verses.forEach(function (v, ai) { QIDX.push({ s: si + 1, a: ai + 1, n: normalizeAr(v.text), t: v.text }); }); }); }
    var nq = normalizeAr(q); if (nq.length < 2) return [];
    var out = []; for (var i = 0; i < QIDX.length && out.length < 40; i++) if (QIDX[i].n.indexOf(nq) >= 0) out.push(QIDX[i]);
    return out;
  }

  /* mushaf home + page */
  function mushafHomeHTML(now) {
    var S = qSet(), q = state.qv.q || "", nq = normalizeAr(q), tab = state.qv.list || "surah";
    var cont = (S.qLast ? '<button class="card q-continue" data-act="q-goto" data-p="' + S.qLast + '"><span class="q-continue-ic">📖</span><span class="grow"><b>آخر صفحة قرأتها</b><small class="muted">صفحة ' + arNum(S.qLast) + " · الجزء " + arNum(juzOf(S.qLast)) + "</small></span><span>←</span></button>" : "");
    var marks = S.qMarks.length ? '<div class="card"><h3 style="margin:0 0 8px">🔖 العلامات</h3>' + S.qMarks.slice().reverse().map(function (m) {
      return '<div class="q-mark"><button class="linkbtn" data-act="q-goto" data-p="' + m.p + '" data-s="' + m.s + '" data-a="' + m.a + '">' + esc(surahName(m.s)) + " · آية " + arNum(m.a) + ' <small class="muted">ص ' + arNum(m.p) + '</small></button><button class="del" data-act="q-mark-del" data-s="' + m.s + '" data-a="' + m.a + '" aria-label="حذف">' + ico("trash") + "</button></div>";
    }).join("") + "</div>" : "";
    var search = '<div class="q-search"><input class="inp" id="qSearch" type="search" placeholder="🔍 دوّر على سورة أو كلمة في القرآن" value="' + esc(q) + '" autocomplete="off"></div>';
    var results = "";
    if (nq.length >= 2) {
      var surs = QURAN.surahs.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return normalizeAr(x.s.name).indexOf(nq) >= 0; });
      var hits = quranSearch(q);
      results = (surs.length ? '<div class="card surah-list" style="padding:6px">' + surs.map(function (x) { return surahRowHTML(x.s, x.i + 1); }).join("") + "</div>" : "") +
        '<div class="card"><h3 style="margin:0 0 6px">' + (hits.length ? (hits.length >= 40 ? "أول 40 نتيجة" : arNum(hits.length) + " نتيجة") : "مفيش آيات فيها «" + esc(q) + "»") + "</h3>" +
        hits.map(function (h) {
          return '<button class="q-hit" data-act="q-goto" data-p="' + pageForAyah(h.s, h.a) + '" data-s="' + h.s + '" data-a="' + h.a + '"><small>' + esc(surahName(h.s)) + " · " + arNum(h.a) + '</small><span class="q-hit-t">' + esc(quranDisplayText(h.t)) + "</span></button>";
        }).join("") + "</div>";
      return head(now) + search + results;
    }
    var seg = '<div class="seg2 two" style="margin-block-end:10px"><button data-act="q-list" data-v="surah" aria-pressed="' + (tab === "surah") + '">السور</button><button data-act="q-list" data-v="juz" aria-pressed="' + (tab === "juz") + '">الأجزاء</button></div>';
    var list = tab === "juz"
      ? QURAN.juzStart.map(function (j, i) {
        var p = pageForAyah(j[0], j[1]);
        return '<button class="surah-row" data-act="q-goto" data-p="' + p + '"><span class="surah-num">' + arNum(i + 1) + '</span><span class="surah-name">الجزء ' + arNum(i + 1) + '</span><span class="muted" style="font-size:12px">' + esc(surahName(j[0])) + " " + arNum(j[1]) + " · ص " + arNum(p) + "</span></button>";
      }).join("")
      : QURAN.surahs.map(function (s, i) { return surahRowHTML(s, i + 1); }).join("");
    return head(now) + search + cont + marks + seg + '<div class="card surah-list" style="padding:6px">' + list + "</div>" +
      '<p class="muted" style="font-size:11px;text-align:center">' + esc(QURAN.source) + "</p>";
  }
  function surahRowHTML(s, num) {
    return '<button class="surah-row" data-act="mushaf-open" data-s="' + num + '"><span class="surah-num">' + arNum(num) + '</span><span class="surah-name">' + esc(s.name) + '</span><span class="muted" style="font-size:12px">' + arNum(s.ayahCount) + " آية · ص " + arNum(pageForSurah(num)) + "</span></button>";
  }
  function mushafPageHTML(now, p) {
    var S = qSet(); p = Math.max(1, Math.min(604, p));
    if (S.qLast !== p) { S.qLast = p; saveMeta("settings", 3000); }
    var ayahs = pageAyahs(p), last = null, body = "", cur = qaCur(), sel = state.qv.sel, hl = state.qv.hl, names = [];
    ayahs.forEach(function (v) {
      if (v.surah !== last) {
        names.push(v.surahName);
        if (v.ayah === 1) body += '<div class="q-surah-head">' + esc(v.surahName) + "</div>" + (v.surah !== 1 && v.surah !== 9 ? '<div class="q-basmala">' + esc(quranDisplayText(QURAN.surahs[0].verses[0].text)) + "</div>" : "");
        last = v.surah;
      }
      var cls = "ayah" + (cur && cur.s === v.surah && cur.a === v.ayah ? " playing" : "") + (sel && sel.s === v.surah && sel.a === v.ayah ? " sel" : "") + (hl && hl.s === v.surah && hl.a === v.ayah ? " hl" : "");
      var marked = S.qMarks.some(function (m) { return m.s === v.surah && m.a === v.ayah; });
      body += '<span class="' + cls + '" data-act="q-ayah" data-s="' + v.surah + '" data-a="' + v.ayah + '">' + esc(quranDisplayText(v.text)) + ' <span class="ayah-n">' + (marked ? "🔖" : "") + "﴿" + arNum(v.ayah) + "﴾</span></span> ";
    });
    var pageMarked = S.qMarks.some(function (m) { return m.p === p; });
    var selBar = sel ? '<div class="q-selbar"><b>' + esc(surahName(sel.s)) + " · آية " + arNum(sel.a) + "</b>" +
      '<button class="btn sm" data-act="qa-from">▶ من هنا</button><button class="btn sm alt" data-act="q-mark" data-s="' + sel.s + '" data-a="' + sel.a + '">🔖</button>' +
      '<button class="btn sm alt" data-act="q-copy">📋</button><button class="btn sm alt" data-act="q-sel-x">✕</button></div>' : "";
    return '<div class="row between" style="margin-block-end:8px"><button class="linkbtn" data-act="mushaf-close">← الفهرس</button><span class="muted" style="font-size:13px">' + esc(names.join(" · ")) + "</span></div>" +
      '<div class="q-tools"><button class="btn sm' + (QA.on && QA.mode === "page" ? "" : " alt") + '" data-act="qa-page">' + (QA.on ? "🔊 شغّال" : "▶ استمع") + "</button>" +
      '<select class="inp q-rec" id="qRec" aria-label="القارئ">' + RECITERS.map(function (r) { return '<option value="' + r.k + '"' + (S.qRec === r.k ? " selected" : "") + ">" + esc(r.n) + "</option>"; }).join("") + "</select>" +
      '<button class="btn sm alt" data-act="q-font" data-v="-2" aria-label="تصغير الخط">A−</button><button class="btn sm alt" data-act="q-font" data-v="2" aria-label="تكبير الخط">A+</button>' +
      '<button class="btn sm ' + (pageMarked ? "" : "alt") + '" data-act="q-mark" data-s="' + ayahs[0].surah + '" data-a="' + ayahs[0].ayah + '" aria-label="علامة">🔖</button></div>' +
      '<div class="card q-page"><div class="row between q-page-h"><span>الجزء ' + arNum(juzOf(p)) + "</span><span>صفحة " + arNum(p) + "</span></div>" +
      '<p class="ayah-block" style="font-size:' + S.qFont + 'px">' + body + "</p>" +
      '<div class="q-page-f">' + arNum(p) + "</div></div>" +
      '<div class="row between" style="gap:8px;margin-block-start:4px">' +
      '<button class="btn sm alt" data-act="mushaf-next" data-p="' + p + '"' + (p >= 604 ? " disabled" : "") + ">الصفحة التالية ←</button>" +
      '<span class="row" style="gap:6px"><input class="inp" id="qJump" type="number" min="1" max="604" inputmode="numeric" placeholder="' + p + '" style="width:76px;text-align:center"><button class="btn sm alt" data-act="q-jump">اذهب</button></span>' +
      '<button class="btn sm alt" data-act="mushaf-prev" data-p="' + p + '"' + (p <= 1 ? " disabled" : "") + ">→ السابقة</button></div>" +
      selBar + qaBarHTML();
  }
  function unitQueue(id) {
    var u = parseUnitId(id); if (!u) return [];
    return unitAyahs(u).map(function (v) { return { s: v.surah, a: v.ayah }; });
  }

  /* events */
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "qRec") {
      qSet().qRec = e.target.value; saveMeta("settings", 400);
      if (QA.on) { QA.fallback = false; qaLoad(); } else render();
    }
    if (e.target && e.target.getAttribute && e.target.getAttribute("data-act") === "q-auto") { qSet().qAuto = e.target.checked; saveMeta("settings", 300); toast(e.target.checked ? "هتتحسب كل صفحة تقلبها في المصحف" : "اتوقف العدّ التلقائي"); }
  });
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "qSearch") { state.qv.q = e.target.value; render(); }
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var S, s, a, p;
    switch (el.getAttribute("data-act")) {
      case "mushaf-next": qaCountPage(state.qv.page - 1); state.qv.sel = null; state.qv.hl = null; if (QA.on && QA.mode === "page") qaPlay(pageAyahs(state.qv.page).map(function (v) { return { s: v.surah, a: v.ayah }; }), 0, "page"); break;
      case "mushaf-prev": case "mushaf-open": state.qv.sel = null; state.qv.hl = null; if (QA.on && QA.mode === "page") qaStop(); break;
      case "q-goto":
        p = Number(el.getAttribute("data-p")); s = Number(el.getAttribute("data-s")); a = Number(el.getAttribute("data-a"));
        state.qv.mode = "mushaf"; state.qv.page = p; state.qv.q = ""; state.qv.sel = null; state.qv.hl = s ? { s: s, a: a } : null;
        $("#p-quran").scrollTop = 0; render();
        if (s) setTimeout(function () { var h = document.querySelector("#p-quran .ayah.hl"); if (h) h.scrollIntoView({ block: "center" }); }, 80);
        break;
      case "q-continue": state.qv = { mode: "mushaf", page: Number(el.getAttribute("data-p")) }; $("#p-quran").scrollTop = 0; render(); ensureQuranLoaded(); break;
      case "q-list": state.qv.list = el.getAttribute("data-v"); render(); break;
      case "q-jump": { var j = Number(($("#qJump") || {}).value); if (j >= 1 && j <= 604) { state.qv.page = j; state.qv.sel = null; $("#p-quran").scrollTop = 0; render(); } else toast("اكتب رقم صفحة من ١ لـ ٦٠٤"); break; }
      case "q-font": S = qSet(); S.qFont = Math.max(18, Math.min(40, S.qFont + Number(el.getAttribute("data-v")))); saveMeta("settings", 600); render(); break;
      case "q-ayah": s = Number(el.getAttribute("data-s")); a = Number(el.getAttribute("data-a")); state.qv.sel = state.qv.sel && state.qv.sel.s === s && state.qv.sel.a === a ? null : { s: s, a: a }; render(); break;
      case "q-sel-x": state.qv.sel = null; render(); break;
      case "q-mark": {
        S = qSet(); s = Number(el.getAttribute("data-s")); a = Number(el.getAttribute("data-a"));
        var at = -1; S.qMarks.forEach(function (m, i) { if (m.s === s && m.a === a) at = i; });
        if (at >= 0) { S.qMarks.splice(at, 1); toast("اتشالت العلامة"); }
        else { S.qMarks.push({ s: s, a: a, p: pageForAyah(s, a), at: nowR().key }); if (S.qMarks.length > 30) S.qMarks.shift(); toast("🔖 اتحطت علامة"); }
        saveMeta("settings", 300); render(); break;
      }
      case "q-mark-del": S = qSet(); s = Number(el.getAttribute("data-s")); a = Number(el.getAttribute("data-a")); S.qMarks = S.qMarks.filter(function (m) { return !(m.s === s && m.a === a); }); saveMeta("settings", 300); render(); break;
      case "q-copy": {
        var sel = state.qv.sel; if (!sel) break;
        var txt = quranDisplayText(QURAN.surahs[sel.s - 1].verses[sel.a - 1].text) + " ﴿" + surahName(sel.s) + ": " + sel.a + "﴾";
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("اتنسخت الآية"); }, function () { toast("تعذّر النسخ"); });
        break;
      }
      case "qa-page": if (QA.on) { qaStop(); break; } qaPlay(pageAyahs(state.qv.page).map(function (v) { return { s: v.surah, a: v.ayah }; }), 0, "page"); break;
      case "qa-from": {
        var q = pageAyahs(state.qv.page).map(function (v) { return { s: v.surah, a: v.ayah }; }), sl = state.qv.sel, idx = 0;
        q.forEach(function (x, i) { if (x.s === sl.s && x.a === sl.a) idx = i; });
        state.qv.sel = null; qaPlay(q, idx, "page"); break;
      }
      case "qa-unit": { var uq = unitQueue(el.getAttribute("data-u")); if (!uq.length) break; if (qSet().qRep < 3) qSet().qRep = 3; qaPlay(uq, 0, "unit"); toast("كل آية هتتكرر " + qSet().qRep + " مرات للحفظ"); break; }
      case "qa-toggle": qaToggle(); break;
      case "qa-next": if (QA.on) { QA.repLeft = 1; qaEnded(); } break;
      case "qa-stop": qaStop(); break;
      case "qa-rep": S = qSet(); S.qRep = S.qRep === 1 ? 3 : S.qRep === 3 ? 5 : S.qRep === 5 ? 10 : 1; QA.repLeft = S.qRep; saveMeta("settings", 400); render(); break;
      case "q-plan": {
        var days = Number(el.getAttribute("data-v")); S = qSet();
        if (!days) { if (confirm("تلغي خطة الختمة؟")) { S.qPlan = null; saveMeta("settings", 0); render(); } break; }
        S.qPlan = { days: days, start: nowR().key, startAbs: khatmaPos().abs }; saveMeta("settings", 0); render(); toast("🎯 بالتوفيق في ختمتك"); break;
      }
    }
  });
