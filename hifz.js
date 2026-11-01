"use strict";
  /* ---------------- القرآن: خطة يومية — حفظ جديد · مراجعة المحفوظ · ورد ---------------- */
  // Everything is measured on the verified Quran data (quran/quran.json): a "global
  // ayah" number g (1..6236, Mushaf order) is the single coordinate. Memorized Quran is
  // a sorted list of merged [from, to] global-ayah ranges in state.learn.hifz.mem, so a
  // whole surah, half a page or a handful of ayahs are all the same shape. Review rotates
  // through the Mushaf pages that contain memorized ayahs; new memorization walks
  // forward (from Al-Fatiha) or juz-Amma-first (An-Nas backwards, each surah read in order).
  var GA = null, PAGE_CHARS = {};
  function gaInit() {
    if (GA || !QURAN) return GA;
    var off = [0], len = [0];
    QURAN.surahs.forEach(function (s, i) {
      off[i + 1] = off[i] + s.ayahCount;
      s.verses.forEach(function (v) { len.push(normalizeAr(v.text).replace(/\s/g, "").length); });
    });
    GA = { off: off, total: off[114], len: len, ps: QURAN.pageStart.map(function (x) { return off[x[0] - 1] + x[1]; }) };
    return GA;
  }
  function gOf(s, a) { return GA.off[s - 1] + a; }
  function saOf(g) { var s = 1; while (s < 114 && GA.off[s] < g) s++; return { s: s, a: g - GA.off[s - 1] }; }
  function pageOfG(g) { var lo = 1, hi = 604; while (lo < hi) { var m = (lo + hi + 1) >> 1; if (GA.ps[m - 1] <= g) lo = m; else hi = m - 1; } return lo; }
  function pageRangeG(p) { return [GA.ps[p - 1], p < 604 ? GA.ps[p] - 1 : GA.total]; }
  function pageChars(p) {
    if (PAGE_CHARS[p]) return PAGE_CHARS[p];
    var r = pageRangeG(p), t = 0; for (var g = r[0]; g <= r[1]; g++) t += GA.len[g];
    return (PAGE_CHARS[p] = t);
  }
  function rangeLabel(a, b) {
    var x = saOf(a), y = saOf(b), n = QURAN.surahs[x.s - 1].name;
    if (x.s === y.s) return n + ": " + (x.a === 1 && y.a === QURAN.surahs[x.s - 1].ayahCount ? "كاملة" : "آية " + arNum(x.a) + (y.a !== x.a ? "–" + arNum(y.a) : ""));
    return n + " " + arNum(x.a) + " ← " + QURAN.surahs[y.s - 1].name + " " + arNum(y.a);
  }
  // Approximate Mushaf lines an ayah takes: its share of its page's text × that page's
  // line count (15, except the two ornamented opening pages, which hold 7 lines each).
  function lineW(g) { var p = pageOfG(g); return GA.len[g] * (p <= 2 ? 7 : 15) / pageChars(p); }
  function linesOf(a, b) { var t = 0; for (var g = a; g <= b; g++) t += lineW(g); return t; }
  function linesLabel(n) {
    if (n >= 14) { var pg = Math.round(n / 15 * 2) / 2; return pg === 1 ? "صفحة" : arNum(pg) + " صفحة"; }
    return arNum(Math.max(1, Math.round(n))) + " سطر";
  }

  /* -------- memorized ranges -------- */
  function hz() {
    if (!state.learn.hifz) state.learn.hifz = { mem: [], dir: "bwd", amt: { t: "lines", n: 7 }, rev: 5, rpos: 0, day: null, log: {}, setup: 0 };
    var H = state.learn.hifz;
    if (!H.log) H.log = {};
    if (!H.mem) H.mem = [];
    if (GA && !H.migrated) { migrateLawh(H); H.migrated = 1; saveMeta("learn", 0); }
    return H;
  }
  function memNormalize(list) {
    list = list.filter(function (r) { return r && r[0] <= r[1]; }).sort(function (x, y) { return x[0] - y[0]; });
    var out = [];
    list.forEach(function (r) {
      var l = out[out.length - 1];
      if (l && r[0] <= l[1] + 1) l[1] = Math.max(l[1], r[1]); else out.push([r[0], r[1]]);
    });
    return out;
  }
  function memAdd(H, a, b) { H.mem = memNormalize(H.mem.concat([[a, b]])); }
  function memRemove(H, a, b) {
    var out = [];
    H.mem.forEach(function (r) {
      if (r[1] < a || r[0] > b) { out.push(r); return; }
      if (r[0] < a) out.push([r[0], a - 1]);
      if (r[1] > b) out.push([b + 1, r[1]]);
    });
    H.mem = out;
  }
  function memHas(H, g) { for (var i = 0; i < H.mem.length; i++) { if (g < H.mem[i][0]) return false; if (g <= H.mem[i][1]) return true; } return false; }
  function memCount(H, a, b) {
    var t = 0;
    H.mem.forEach(function (r) { var x = Math.max(a, r[0]), y = Math.min(b, r[1]); if (y >= x) t += y - x + 1; });
    return t;
  }
  function memTotal(H) { return H.mem.reduce(function (t, r) { return t + r[1] - r[0] + 1; }, 0); }
  // Pages that hold any memorized ayah, in Mushaf order — what the review cycle walks.
  function memPages(H) {
    var out = [];
    H.mem.forEach(function (r) { for (var p = pageOfG(r[0]), e = pageOfG(r[1]); p <= e; p++) if (out[out.length - 1] !== p) out.push(p); });
    return out;
  }
  // Old "اللوح" board: every unit marked memorized becomes a memorized range.
  function migrateLawh(H) {
    var L = state.learn.lawh; if (!L || !L.units) return;
    Object.keys(L.units).forEach(function (id) {
      var c = L.units[id], m = /^s(\d+)(?::(\d+)-(\d+))?$/.exec(id); if (!m || !c || c.status !== 2) return;
      var s = Number(m[1]), su = QURAN.surahs[s - 1]; if (!su) return;
      var from = m[2] ? Number(m[2]) : 1, to = m[3] ? Math.min(su.ayahCount, Number(m[3])) : su.ayahCount;
      memAdd(H, gOf(s, from), gOf(s, to));
      H.setup = 1;
    });
  }

  /* -------- daily portions -------- */
  function surahOrder(H) {
    var o = []; for (var s = 1; s <= 114; s++) o.push(s);
    return H.dir === "fwd" ? o : o.reverse();
  }
  // The next ayah to memorize: first un-memorized ayah walking the chosen order.
  function nextHifzStart(H) {
    var order = surahOrder(H);
    for (var i = 0; i < order.length; i++) {
      var s = order[i], a0 = gOf(s, 1), a1 = gOf(s, QURAN.surahs[s - 1].ayahCount);
      if (memCount(H, a0, a1) === a1 - a0 + 1) continue;
      for (var g = a0; g <= a1; g++) if (!memHas(H, g)) return g;
    }
    return 0;
  }
  // One sitting's amount from g0, never crossing into the next surah or into an
  // already memorized ayah; "lines" are measured against that page's own text length.
  // When a short surah ends well before the amount (juz Amma), the next whole surah
  // in the chosen order is added too if it still fits — so a portion is a list of ranges.
  function hifzPortion(H, g0) {
    if (!g0) return null;
    var n = Math.max(1, H.amt.n), byAyah = H.amt.t === "ayahs", out = [], acc = 0;
    function w(g) { return byAyah ? 1 : lineW(g); }
    var s = saOf(g0).s, end = gOf(s, QURAN.surahs[s - 1].ayahCount), g = g0;
    acc = w(g);
    while (g < end && !memHas(H, g + 1) && acc < n) {
      var add = w(g + 1);
      if (!byAyah && acc + add > n * 1.15 && acc >= n * 0.6) break;
      g++; acc += add;
    }
    out.push([g0, g]);
    if (g !== end) return out;
    var order = surahOrder(H), i = order.indexOf(s);
    for (var k = i + 1; k < order.length && acc < n * 0.75; k++) {
      var s2 = order[k], a = gOf(s2, 1), b = gOf(s2, QURAN.surahs[s2 - 1].ayahCount);
      if (memCount(H, a, b)) break;
      var t = 0; for (var x = a; x <= b; x++) t += w(x);
      if (acc + t > n * 1.15) break;
      out.push([a, b]); acc += t;
    }
    return out;
  }
  function portionLabel(list) { return list.map(function (r) { return rangeLabel(r[0], r[1]); }).join(" + "); }
  function portionLines(list) { return list.reduce(function (t, r) { return t + linesOf(r[0], r[1]); }, 0); }
  // Consecutive Mushaf pages grouped into runs, e.g. [2,3,4,604] -> [[2,4],[604,604]].
  function pageRuns(pages) {
    var out = [];
    pages.forEach(function (p) { var l = out[out.length - 1]; if (l && p === l[1] + 1) l[1] = p; else out.push([p, p]); });
    return out;
  }
  function reviewPortion(H) {
    var pages = memPages(H); if (!pages.length) return [];
    var n = Math.min(pages.length, Math.max(1, H.rev)), start = (H.rpos || 0) % pages.length, out = [];
    for (var i = 0; i < n; i++) out.push(pages[(start + i) % pages.length]);
    return out;
  }
  // Today's plan is fixed once made, so finishing a part never reshuffles the rest.
  function hzToday(now) {
    var H = hz();
    if (!H.day || H.day.key !== now.key || (H.day.h && typeof H.day.h[0] === "number")) {
      var g0 = nextHifzStart(H);
      H.day = { key: now.key, h: H.amt.n > 0 ? hifzPortion(H, g0) : null, hDone: 0, extra: [], r: H.rev > 0 ? reviewPortion(H) : [], rDone: 0 };
      saveMeta("learn", 1500);
    }
    return H.day;
  }
  // Ranges memorized in the last 7 days — "ربط القريب", repeated daily until it settles.
  function recentHifz(H, now) {
    var out = [];
    for (var i = 1; i <= 7; i++) { var k = addDays(now.key, -i), l = H.log[k]; if (l && l.h) l.h.forEach(function (r) { out.push(r); }); }
    return memNormalize(out);
  }
  function hzLog(H, key) { return H.log[key] || (H.log[key] = { h: [], r: [] }); }
  function hzStreak(H, now) {
    var k = now.key, n = 0;
    function did(k2) { var l = H.log[k2]; return l && ((l.h && l.h.length) || (l.r && l.r.length)); }
    if (!did(k)) k = addDays(k, -1);
    while (did(k) && n < 3000) { n++; k = addDays(k, -1); }
    return n;
  }
  // For the home "خطة اليوم" card: how much of today's hifz+review is done (null = not set up).
  function hifzPlanStatus(now) {
    var H = state.learn.hifz; if (!H || !H.setup) return null;
    var d = H.day && H.day.key === now.key ? H.day : null, parts = [];
    if (H.amt.n > 0) parts.push(d && d.hDone ? 1 : 0);
    if (H.rev > 0 && H.mem.length) parts.push(d && d.rDone ? 1 : 0);
    if (!parts.length) return null;
    var done = parts.reduce(function (a, b) { return a + b; }, 0);
    return { done: done, total: parts.length };
  }

  /* -------- views -------- */
  function qLoading(now) { return head(now) + '<div class="card"><p class="muted" style="font-size:14px">جاري تحميل نص القرآن…</p></div>'; }
  function rangesAttr(list) { return list.map(function (r) { return r[0] + "-" + r[1]; }).join(","); }
  function parseRanges(v) { return String(v || "").split(",").map(function (x) { var p = x.split("-").map(Number); return [p[0], p[1]]; }).filter(function (r) { return r[0] > 0 && r[1] >= r[0]; }); }
  function hzPortionBtns(list) {
    return '<button class="btn sm alt" data-act="hz-open" data-r="' + rangesAttr(list) + '">' + ic("book") + " افتح في المصحف</button>" +
      '<button class="btn sm alt" data-act="hz-listen" data-r="' + rangesAttr(list) + '">' + ic("headphones") + " استمع وكرّر</button>";
  }
  function hzTodayView(now) {
    if (!QURAN) return qLoading(now);
    gaInit();
    var H = hz(), d = hzToday(now), total = memTotal(H), pct = Math.round(total / GA.total * 1000) / 10, pages = memPages(H);
    var setup = H.setup ? "" : '<div class="card hz-setup"><h3 style="margin:0 0 6px">' + ic("target") + " ابدأ خطتك في ٣ خطوات</h3>" +
      '<ol class="hz-steps"><li>حدّد اللي <b>حافظه قبل كده</b> من «محفوظي» (عشان يدخل في المراجعة).</li><li>اختار <b>كمية الحفظ</b> اليومية واتجاهه.</li><li>اختار <b>كمية المراجعة</b> اليومية.</li></ol>' +
      '<div class="row wrapr"><button class="btn" data-act="qv" data-m="mem">' + ic("check") + ' حدّد محفوظي</button><button class="btn alt" data-act="hz-setup-ok">تمام، الإعدادات الافتراضية كويسة</button></div></div>';

    // 1) حفظ جديد
    var hCard;
    if (H.amt.n <= 0) hCard = '<div class="card hz-card"><div class="hz-h"><span class="hz-ic new">' + ic("plus") + '</span><h3>الحفظ الجديد</h3></div><p class="muted" style="font-size:14px">الحفظ الجديد متوقف — شغّله من الإعدادات تحت.</p></div>';
    else if (!d.h) hCard = '<div class="card hz-card"><div class="hz-h"><span class="hz-ic new">' + ic("plus") + '</span><h3>الحفظ الجديد</h3></div><p style="font-size:15px">🎉 ما شاء الله — حفظت المصحف كله في الاتجاه ده. ركّز على المراجعة.</p></div>';
    else {
      var hp = pageOfG(d.h[0][0]);
      hCard = '<div class="card hz-card' + (d.hDone ? " done" : "") + '"><div class="hz-h"><span class="hz-ic new">' + ic("plus") + '</span><h3>الحفظ الجديد</h3>' + (d.hDone ? '<span class="chip on">✓ تم</span>' : '<span class="chip">' + linesLabel(portionLines(d.h)) + "</span>") + "</div>" +
        '<p class="hz-portion">' + esc(portionLabel(d.h)) + '</p><p class="muted" style="font-size:12px;margin:0 0 10px">صفحة ' + arNum(hp) + " · الجزء " + arNum(juzOf(hp)) + "</p>" +
        (d.hDone ? "" : '<p class="hz-tip">' + ic("bulb") + " اسمعها ٣ مرات، اقرأها من المصحف ٥ مرات، وبعدين سمّعها لنفسك من غير ما تبص.</p>") +
        '<div class="row wrapr">' + hzPortionBtns(d.h) + "</div>" +
        '<div class="row wrapr" style="margin-block-start:10px">' + (d.hDone
          ? '<button class="btn sm alt" data-act="hz-more">' + ic("plus") + " احفظ كمية كمان</button>"
          : '<button class="btn" data-act="hz-done">' + ic("check") + " حفظتها</button>") + "</div></div>";
    }

    // 2) مراجعة المحفوظ
    var rCard, recent = recentHifz(H, now);
    if (!pages.length) rCard = '<div class="card hz-card"><div class="hz-h"><span class="hz-ic rev">' + ic("refresh") + '</span><h3>مراجعة المحفوظ</h3></div><p class="muted" style="font-size:14px">لسه مفيش محفوظ مسجّل. حدّد اللي حافظه من «محفوظي»، أو ابدأ بالحفظ الجديد وهيدخل المراجعة لوحده.</p></div>';
    else if (H.rev <= 0) rCard = '<div class="card hz-card"><div class="hz-h"><span class="hz-ic rev">' + ic("refresh") + '</span><h3>مراجعة المحفوظ</h3></div><p class="muted" style="font-size:14px">المراجعة متوقفة — شغّلها من الإعدادات تحت.</p></div>';
    else {
      var r = d.r, runs = pageRuns(r), cycleDays = Math.ceil(pages.length / Math.max(1, H.rev));
      var runsHTML = runs.map(function (x) {
        var g1 = pageRangeG(x[0])[0], g2 = pageRangeG(x[1])[1], n1 = QURAN.surahs[saOf(g1).s - 1].name, n2 = QURAN.surahs[saOf(g2).s - 1].name;
        return '<button class="hz-run" data-act="hz-page" data-p="' + x[0] + '"><b>' + (x[0] === x[1] ? "ص " + arNum(x[0]) : "ص " + arNum(x[0]) + "–" + arNum(x[1])) + "</b><small>" + esc(n1 === n2 ? n1 : n1 + " ← " + n2) + "</small>" + ic("book") + "</button>";
      }).join("");
      rCard = '<div class="card hz-card' + (d.rDone ? " done" : "") + '"><div class="hz-h"><span class="hz-ic rev">' + ic("refresh") + '</span><h3>مراجعة المحفوظ</h3>' + (d.rDone ? '<span class="chip on">✓ تم</span>' : '<span class="chip">' + arNum(r.length) + " صفحة</span>") + "</div>" +
        '<div class="hz-runs">' + runsHTML + '</div><p class="muted" style="font-size:12px;margin:6px 0 0">دورة كاملة على محفوظك كله كل ' + arNum(cycleDays) + " يوم</p>" +
        (recent.length ? '<div class="hz-recent"><b>' + ic("link") + " ربط القريب</b> <small class=\"muted\">(اللي حفظته آخر ٧ أيام — اقراه مرة كل يوم لحد ما يثبت)</small>" +
          recent.map(function (x) { return '<button class="linkbtn" data-act="hz-open" data-r="' + x[0] + "-" + x[1] + '">' + esc(rangeLabel(x[0], x[1])) + "</button>"; }).join("") + "</div>" : "") +
        '<div class="row wrapr" style="margin-block-start:10px">' + (d.rDone ? "" : '<button class="btn" data-act="hz-rdone">' + ic("check") + " راجعتها</button>") + "</div></div>";
    }

    // 3) الورد
    var t = target(), n = pagesOn(now.key), pos = khatmaPos();
    var wCard = '<div class="card hz-card' + (n >= t ? " done" : "") + '"><div class="hz-h"><span class="hz-ic wird">' + ic("book") + '</span><h3>الورد (تلاوة)</h3><span class="chip' + (n >= t ? " on" : "") + '">' + arNum(n) + " / " + arNum(t) + " صفحة</span></div>" +
      '<div class="bar"><i style="width:' + Math.min(100, Math.round(n / t * 100)) + '%"></i></div>' +
      '<div class="row wrapr" style="margin-block-start:10px"><button class="btn sm" data-act="q-continue" data-p="' + pos.cur + '">' + ic("play") + " كمّل من صفحة " + arNum(pos.cur) + "</button>" +
      '<button class="btn sm alt" data-act="pg" data-n="1">+١</button><button class="btn sm alt" data-act="pg" data-n="5">+٥</button>' +
      (n < t ? '<button class="btn sm alt" data-act="pgdone">أتممت وردي</button>' : "") + "</div>" +
      '<button class="linkbtn" data-act="qv" data-m="wird" style="margin-block-start:6px">خطة الختمة وإحصائيات الورد ←</button></div>';

    var stats = '<div class="hz-stats"><div><b class="num">' + arNum(pct) + '%</b><small>من المصحف</small></div><div><b class="num">' + arNum(pages.length) + '</b><small>صفحة محفوظة</small></div>' +
      '<div><b class="num">' + arNum(Math.floor(pages.length / 20)) + '</b><small>جزء تقريبًا</small></div><div><b class="num">' + ic("flame") + " " + arNum(hzStreak(H, now)) + "</b><small>يوم متواصل</small></div></div>";
    return head(now) + setup + stats + hCard + rCard + wCard + hzSettingsHTML(H, pages);
  }
  function hzSettingsHTML(H, pages) {
    var amts = [["lines", 3, "٣ أسطر"], ["lines", 5, "٥ أسطر"], ["lines", 7, "نص صفحة"], ["lines", 15, "صفحة"], ["lines", 30, "صفحتين"], ["ayahs", 3, "٣ آيات"], ["ayahs", 5, "٥ آيات"], ["ayahs", 10, "١٠ آيات"], ["off", 0, "إيقاف"]];
    var revs = [[2, "صفحتين"], [5, "٥ صفحات"], [10, "١٠ صفحات"], [20, "جزء"], [40, "جزأين"], [0, "إيقاف"]];
    return '<details class="card hz-set"' + (H.setup ? "" : " open") + '><summary><b>' + ic("gear") + " إعدادات الخطة</b></summary>" +
      '<div class="field">كمية الحفظ اليومية<div class="row wrapr" style="gap:6px">' + amts.map(function (x) {
        var on = x[0] === "off" ? H.amt.n <= 0 : (H.amt.t === x[0] && H.amt.n === x[1]);
        return '<button class="chipbtn' + (on ? " on" : "") + '" data-act="hz-amt" data-t="' + x[0] + '" data-n="' + x[1] + '">' + x[2] + "</button>";
      }).join("") + "</div></div>" +
      '<div class="field">اتجاه الحفظ<div class="seg2 two"><button data-act="hz-dir" data-v="bwd" aria-pressed="' + (H.dir !== "fwd") + '">من جزء عمّ (الناس ← البقرة)</button><button data-act="hz-dir" data-v="fwd" aria-pressed="' + (H.dir === "fwd") + '">من الفاتحة (البقرة ← الناس)</button></div></div>' +
      '<div class="field">كمية المراجعة اليومية<div class="row wrapr" style="gap:6px">' + revs.map(function (x) {
        return '<button class="chipbtn' + (H.rev === x[0] ? " on" : "") + '" data-act="hz-rev" data-n="' + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>" + (pages.length && H.rev > 0 ? '<small class="muted">محفوظك ' + arNum(pages.length) + " صفحة ← دورة مراجعة كاملة كل " + arNum(Math.ceil(pages.length / H.rev)) + " يوم</small>" : "") + "</div>" +
      '<p class="muted" style="font-size:12px;margin:0">التغيير بيطبق من بكرة. لو عايزه يطبق النهارده دوس <button class="linkbtn" data-act="hz-rebuild">أعد حساب خطة النهارده</button></p></details>';
  }

  // «محفوظي»: mark what's already memorized — by juz, or surah by surah.
  function hzMemView(now) {
    if (!QURAN) return qLoading(now);
    gaInit();
    var H = hz(), f = state.qv.memF || "juz";
    var seg = '<div class="seg2 two" style="margin-block-end:10px"><button data-act="hz-memf" data-v="juz" aria-pressed="' + (f === "juz") + '">بالأجزاء</button><button data-act="hz-memf" data-v="surah" aria-pressed="' + (f === "surah") + '">بالسور</button></div>';
    var list;
    if (f === "juz") {
      list = '<div class="hz-juz">' + QURAN.juzStart.map(function (j, i) {
        var a = gOf(j[0], j[1]), b = i < 29 ? gOf(QURAN.juzStart[i + 1][0], QURAN.juzStart[i + 1][1]) - 1 : GA.total;
        var c = memCount(H, a, b), p = Math.round(c / (b - a + 1) * 100);
        return '<button class="hz-jz' + (p === 100 ? " full" : p > 0 ? " part" : "") + '" data-act="hz-mem" data-a="' + a + '" data-b="' + b + '" data-full="' + (p === 100 ? 1 : 0) + '"><b>' + arNum(i + 1) + "</b><small>" + (p === 100 ? "✓" : p > 0 ? arNum(p) + "%" : "") + "</small></button>";
      }).join("") + "</div>";
    } else {
      list = '<div class="card surah-list" style="padding:6px">' + QURAN.surahs.map(function (s, i) {
        var a = gOf(i + 1, 1), b = gOf(i + 1, s.ayahCount), c = memCount(H, a, b), full = c === b - a + 1;
        return '<button class="surah-row" data-act="hz-mem" data-a="' + a + '" data-b="' + b + '" data-full="' + (full ? 1 : 0) + '"><span class="surah-num">' + arNum(i + 1) + '</span><span class="surah-name">' + esc(s.name) + '</span><span class="hz-mark' + (full ? " on" : c ? " part" : "") + '">' + (full ? ic("check") : c ? arNum(Math.round(c / (b - a + 1) * 100)) + "%" : "") + "</span></button>";
      }).join("") + "</div>";
    }
    var total = memTotal(H);
    var custom = '<div class="card"><h3 style="margin:0 0 6px">جزء من سورة</h3><p class="muted" style="font-size:13px;margin:0 0 8px">حافظ جزء من سورة بس؟ حدّده بالآيات.</p>' +
      '<div class="row wrapr" style="align-items:end;gap:8px"><label class="field" style="flex:2;min-width:130px">السورة<select class="inp" id="hzS">' + QURAN.surahs.map(function (s, i) { return '<option value="' + (i + 1) + '">' + arNum(i + 1) + " · " + esc(s.name) + "</option>"; }).join("") + "</select></label>" +
      '<label class="field" style="flex:1;min-width:70px">من آية<input class="inp" id="hzFrom" type="number" min="1" inputmode="numeric" placeholder="1"></label>' +
      '<label class="field" style="flex:1;min-width:70px">إلى آية<input class="inp" id="hzTo" type="number" min="1" inputmode="numeric"></label></div>' +
      '<div class="row wrapr"><button class="btn sm" data-act="hz-mem-range" data-v="1">' + ic("check") + ' حافظها</button><button class="btn sm alt" data-act="hz-mem-range" data-v="0">مش حافظها</button></div></div>';
    return head(now) + '<div class="card"><div class="row between"><h3 style="margin:0">محفوظي</h3><span class="chip">' + arNum(Math.round(total / GA.total * 1000) / 10) + "% · " + arNum(memPages(H).length) + " صفحة</span></div>" +
      '<p class="muted" style="font-size:13px;margin:6px 0 0">اضغط على الجزء أو السورة اللي حافظها عشان تدخل في دورة المراجعة. اضغط تاني للإلغاء.</p></div>' +
      seg + list + custom;
  }

  /* -------- events -------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"); if (act.indexOf("hz-") !== 0) return;
    if (!QURAN || !gaInit()) return;
    var H = hz(), now = nowR(), d = H.day && H.day.key === now.key ? H.day : null, a, b;
    switch (act) {
      case "hz-open": {
        var rl = parseRanges(el.getAttribute("data-r")); if (!rl.length) break;
        state.qv = { mode: "mushaf", page: pageOfG(rl[0][0]), range: rl, back: state.qv && state.qv.mode };
        $("#p-quran").scrollTop = 0; render();
        setTimeout(function () { var h = document.querySelector("#p-quran .ayah.hz"); if (h) h.scrollIntoView({ block: "center" }); }, 80);
        break;
      }
      case "hz-page": state.qv = { mode: "mushaf", page: Number(el.getAttribute("data-p")), back: "today" }; $("#p-quran").scrollTop = 0; render(); break;
      case "hz-listen": {
        var q = [];
        parseRanges(el.getAttribute("data-r")).forEach(function (r) { for (var g = r[0]; g <= r[1]; g++) { var x = saOf(g); q.push({ s: x.s, a: x.a }); } });
        if (!q.length) break;
        if (qSet().qRep < 3) qSet().qRep = 3;
        qaPlay(q, 0, "unit"); toast("كل آية هتتكرر " + qSet().qRep + " مرات — غيّرها من زرار التكرار"); break;
      }
      case "hz-done":
        if (!d || !d.h) break;
        d.h.forEach(function (r) { memAdd(H, r[0], r[1]); hzLog(H, now.key).h.push(r.slice()); }); d.hDone = 1;
        H.setup = 1; saveMeta("learn", 0); toast("بارك الله فيك — اتضافت لمحفوظك"); render(); break;
      case "hz-more": {
        if (!d) break;
        var nx = hifzPortion(H, nextHifzStart(H));
        if (!nx) { toast("مفيش حفظ جديد باقي في الاتجاه ده"); break; }
        d.h = nx; d.hDone = 0; saveMeta("learn", 400); render(); break;
      }
      case "hz-rdone": {
        if (!d || !d.r.length) break;
        var pages = memPages(H);
        H.rpos = ((H.rpos || 0) + d.r.length) % Math.max(1, pages.length);
        d.rDone = 1; hzLog(H, now.key).r = d.r.slice(); H.setup = 1; saveMeta("learn", 0); toast("تقبّل الله — المراجعة الجاية بتكمل من بعدها"); render(); break;
      }
      case "hz-setup-ok": H.setup = 1; saveMeta("learn", 0); render(); break;
      case "hz-amt":
        H.amt = el.getAttribute("data-t") === "off" ? { t: H.amt.t, n: 0 } : { t: el.getAttribute("data-t"), n: Number(el.getAttribute("data-n")) };
        H.setup = 1; saveMeta("learn", 400); render(); break;
      case "hz-dir": H.dir = el.getAttribute("data-v"); H.setup = 1; saveMeta("learn", 400); render(); break;
      case "hz-rev": H.rev = Number(el.getAttribute("data-n")); H.setup = 1; saveMeta("learn", 400); render(); break;
      case "hz-rebuild":
        e.preventDefault();
        if (d && (d.hDone || d.rDone) && !confirm("هتتعاد خطة النهارده من الأول (اللي اتسجّل محفوظ هيفضل محفوظ). أكمّل؟")) break;
        H.day = null; hzToday(now); render(); break;
      case "hz-memf": state.qv.memF = el.getAttribute("data-v"); render(); break;
      case "hz-mem":
        a = Number(el.getAttribute("data-a")); b = Number(el.getAttribute("data-b"));
        if (el.getAttribute("data-full") === "1") memRemove(H, a, b); else memAdd(H, a, b);
        H.setup = 1; if (d && !d.rDone) d.r = reviewPortion(H); if (d && !d.hDone && H.amt.n > 0) d.h = hifzPortion(H, nextHifzStart(H));
        saveMeta("learn", 600); render(); break;
      case "hz-mem-range": {
        var s = Number(($("#hzS") || {}).value), su = QURAN.surahs[s - 1]; if (!su) break;
        var f = Math.max(1, Math.min(su.ayahCount, Number(($("#hzFrom") || {}).value) || 1));
        var t = Math.max(f, Math.min(su.ayahCount, Number(($("#hzTo") || {}).value) || su.ayahCount));
        if (el.getAttribute("data-v") === "1") memAdd(H, gOf(s, f), gOf(s, t)); else memRemove(H, gOf(s, f), gOf(s, t));
        H.setup = 1; if (d && !d.rDone) d.r = reviewPortion(H); if (d && !d.hDone && H.amt.n > 0) d.h = hifzPortion(H, nextHifzStart(H));
        saveMeta("learn", 400); toast(su.name + " " + arNum(f) + "–" + arNum(t) + (el.getAttribute("data-v") === "1" ? " اتضافت لمحفوظك" : " اتشالت من محفوظك")); render(); break;
      }
    }
  });
