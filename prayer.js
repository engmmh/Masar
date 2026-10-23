"use strict";
  /* ---------------- azkar (morning / evening remembrance) ---------------- */
  var AZKAR = {
    morning: [
      { t: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ", n: 1, note: "آية الكرسي" },
      { t: "قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", n: 3, note: "سورة الإخلاص" },
      { t: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", n: 3, note: "سورة الفلق" },
      { t: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ", n: 3, note: "سورة الناس" },
      { t: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ", n: 1 },
      { t: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", n: 1 },
      { t: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", n: 1, note: "سيد الاستغفار — من قالها موقنًا بها حين يصبح فمات من يومه دخل الجنة" },
      { t: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ", n: 4 },
      { t: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَٰهَ إِلَّا أَنْتَ", n: 3 },
      { t: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", n: 7 },
      { t: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", n: 3 },
      { t: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا", n: 3 },
      { t: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", n: 3 },
      { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", n: 100, note: "من قالها مئة مرة حُطّت خطاياه وإن كانت مثل زبد البحر" },
      { t: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", n: 10 }
    ],
    evening: [
      { t: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ", n: 1, note: "آية الكرسي" },
      { t: "قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", n: 3, note: "سورة الإخلاص" },
      { t: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", n: 3, note: "سورة الفلق" },
      { t: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ", n: 3, note: "سورة الناس" },
      { t: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا", n: 1 },
      { t: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", n: 1 },
      { t: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", n: 1, note: "سيد الاستغفار — من قالها موقنًا بها حين يمسي فمات من ليلته دخل الجنة" },
      { t: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ", n: 4 },
      { t: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَٰهَ إِلَّا أَنْتَ", n: 3 },
      { t: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", n: 7 },
      { t: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", n: 3 },
      { t: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا", n: 3 },
      { t: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", n: 3 },
      { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", n: 100, note: "من قالها مئة مرة حُطّت خطاياه وإن كانت مثل زبد البحر" },
      { t: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", n: 10 }
    ]
  };


  /* ---------------- prayer times (Umm al-Qura, Riyadh) ---------------- */
  var rad = Math.PI / 180, deg = 180 / Math.PI;
  function sin(d) { return Math.sin(d * rad); } function cos(d) { return Math.cos(d * rad); } function tan(d) { return Math.tan(d * rad); }
  function asin(x) { return deg * Math.asin(x); } function acos(x) { return deg * Math.acos(x); }
  function atan2(y, x) { return deg * Math.atan2(y, x); } function arccot(x) { return deg * Math.atan(1 / x); }
  function fixA(a) { return a - 360 * Math.floor(a / 360); } function fixH(a) { return a - 24 * Math.floor(a / 24); }
  function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12; } var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
  function sunPos(jd) {
    var D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
    var L = fixA(q + 1.915 * sin(g) + 0.020 * sin(2 * g)), e = 23.439 - 0.00000036 * D;
    var RA = fixH(atan2(cos(e) * sin(L), cos(L)) / 15);
    return { decl: asin(sin(e) * sin(L)), eq: q / 15 - RA };
  }
  function midDay(jd, t) { return fixH(12 - sunPos(jd + t).eq); }
  function angleTime(jd, ang, t, ccw) {
    var decl = sunPos(jd + t).decl, noon = midDay(jd, t);
    var x = (-sin(ang) - sin(decl) * sin(LAT)) / (cos(decl) * cos(LAT));
    return noon + (ccw ? -1 : 1) * acos(x) / 15;
  }
  function asrTime(jd, f, t) {
    var decl = sunPos(jd + t).decl;
    return angleTime(jd, -arccot(f + tan(Math.abs(LAT - decl))), t, false);
  }
  function isRamadan(y, m, d) {
    try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12))) === "9"; }
    catch (e) { return false; }
  }
  var schedCache = {};
  function sched(key) {
    if (schedCache[key]) return schedCache[key];
    var p = key.split("-").map(Number), jd = julian(p[0], p[1], p[2]) - LNG / (15 * 24);
    var t = { fajr: 5 / 24, sunrise: 6 / 24, dhuhr: 12 / 24, asr: 13 / 24, sunset: 18 / 24 }, r, k;
    for (var i = 0; i < 2; i++) {
      r = { fajr: angleTime(jd, 18.5, t.fajr, true), sunrise: angleTime(jd, 0.833, t.sunrise, true), dhuhr: midDay(jd, t.dhuhr), asr: asrTime(jd, 1, t.asr), sunset: angleTime(jd, 0.833, t.sunset, false) };
      t = {}; for (k in r) t[k] = r[k] / 24;
    }
    var adj = TZ - LNG / 15; for (k in r) r[k] += adj;
    var isha = r.sunset + (isRamadan(p[0], p[1], p[2]) ? 120 : 90) / 60;
    var out = { times: [r.fajr, r.dhuhr, r.asr, r.sunset, isha], sunrise: r.sunrise };
    schedCache[key] = out; return out;
  }
  function windowOf(key, i) {
    var s = sched(key), start = s.times[i], end;
    if (i === 0) end = s.sunrise; else if (i === 1) end = s.times[2]; else if (i === 2) end = s.times[3];
    else if (i === 3) end = s.times[4]; else end = 24 + sched(addDays(key, 1)).times[0];
    return { start: start, end: end };
  }
  function pname(key, i) { return (i === 1 && dowOf(key) === 5) ? "الجمعة" : PRAYERS[i].n; }
  function hijri(key) {
    try {
      var p = key.split("-").map(Number);
      return new Intl.DateTimeFormat("ar-u-nu-latn-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(p[0], p[1] - 1, p[2], 12)));
    } catch (e) { return ""; }
  }
  function greg(key) {
    var p = key.split("-").map(Number);
    return WD[dowOf(key)] + " " + p[2] + "/" + p[1] + "/" + p[0];
  }


  /* ---------------- prayer logic ---------------- */
  function rec(key, i) { var d = state.days[key]; return d && d[PRAYERS[i].k]; }
  function status(key, i, now) {
    var r = rec(key, i);
    if (r && r.t) return r.late ? "late" : (r.qada ? "qada" : "done");
    if (key < state.settings.startDate) return "na";
    if (key > now.key) return "future";
    if (key < now.key) return "missed";
    var w = windowOf(key, i);
    if (now.h < w.start) return "upcoming";
    if (now.h < w.end) return "current";
    return "missed";
  }
  function isDone(st) { return st === "done" || st === "late" || st === "qada"; }
  // Real epoch ms of a prayer window's end, for comparing against a recorded qada
  // timestamp (r.t, itself a real Date.now() epoch ms, not the TZ-shifted "virtual hour"
  // windowOf() returns). shiftedMidnight is "key"'s midnight in the same +TZ-shifted frame
  // nowR() uses, so subtracting TZ*3600e3 converts back to a true, comparable epoch.
  function windowEndMs(key, i) {
    var p = key.split("-").map(Number);
    var shiftedMidnight = Date.UTC(p[0], p[1] - 1, p[2]);
    return shiftedMidnight + windowOf(key, i).end * 3600000 - TZ * 3600000;
  }
  // "كامل" (complete) day: every prayer recorded, and any qada recorded within 48h of
  // that prayer's window ending — a qada logged a week later no longer keeps the streak.
  function dayComplete(key) {
    var d = state.days[key]; if (!d) return false;
    return PRAYERS.every(function (p, i) {
      var r = d[p.k]; if (!r || !r.t) return false;
      if (!r.qada) return true;
      return (r.t - windowEndMs(key, i)) <= 48 * 3600000;
    });
  }
  // "في الوقت" (on time) day: all 5 prayers registered inside their own window — stricter
  // than dayComplete(), which also accepts same-day-late or 48h-qada recordings.
  function dayOnTime(key) {
    var d = state.days[key]; if (!d) return false;
    return PRAYERS.every(function (p) { var r = d[p.k]; return !!(r && r.t && !r.late && !r.qada); });
  }
  function streakBy(now, test) {
    var k = now.key, n = 0;
    if (!test(k)) k = addDays(k, -1);
    while (test(k) && n < 5000) { n++; k = addDays(k, -1); }
    return n;
  }
  function bestStreakBy(test) {
    var keys = Object.keys(state.days).sort(), best = 0, cur = 0, prev = null;
    keys.forEach(function (k) {
      if (test(k)) { cur = (prev && addDays(prev, 1) === k) ? cur + 1 : 1; prev = k; if (cur > best) best = cur; }
      else { cur = 0; prev = null; }
    });
    return best;
  }
  function streak(now) { return streakBy(now, dayComplete); }
  function bestStreak() { return bestStreakBy(dayComplete); }
  function streakOnTime(now) { return streakBy(now, dayOnTime); }
  function bestStreakOnTime() { return bestStreakBy(dayOnTime); }
  function fmtDaysAr(n) {
    if (n === 1) return "يوم";
    if (n === 2) return "يومين";
    if (n >= 3 && n <= 10) return n + " أيام";
    return n + " يوم";
  }
  var STREAK_MILESTONES = [
    { d: 3, label: "3 أيام" }, { d: 7, label: "أسبوع كامل" }, { d: 14, label: "أسبوعين" },
    { d: 30, label: "شهر كامل" }, { d: 50, label: "50 يوم" }, { d: 100, label: "100 يوم" },
    { d: 200, label: "200 يوم" }, { d: 365, label: "سنة كاملة" }
  ];
  // Two parallel streaks shown side by side: "كامل" (complete — every prayer eventually
  // recorded, qada within 48h) drives the main message/milestones since it's the more
  // forgiving, encouraging number; "في الوقت" (on-time only) sits beside it as the
  // stricter companion stat, with its own best-ever record shown only if higher.
  function streakBannerHTML(now) {
    var st = streak(now), best = bestStreak();
    var stOT = streakOnTime(now), bestOT = bestStreakOnTime();
    if (!st && !stOT) {
      return '<div class="card streakbanner off"><div class="sb-ico">' + ico("flame") + '</div><div class="sb-body"><h3>ابدأ سلسلتك اليوم</h3><p class="muted" style="font-size:14px">خلّص الصلوات الخمس النهاردة عشان تبدأ سلسلة جديدة' + (best ? " · أفضل سلسلة سابقة " + best + " يوم" : "") + "</p></div></div>";
    }
    var hit = STREAK_MILESTONES.filter(function (m) { return m.d === st; })[0];
    var next = STREAK_MILESTONES.filter(function (m) { return m.d > st; })[0];
    var sub = !st ? "بدأت النهاردة" : hit ? "🎉 وصلت لـ" + hit.label + "! استمر كده"
      : (next ? "كمان " + fmtDaysAr(next.d - st) + " لـ" + next.label + " 🔥"
        : "رقم قياسي! استمر على البركة");
    return '<div class="card streakbanner on dual"><div class="sb-col sb-main"><div class="sb-ico">' + ico("flame") + '</div><div class="sb-body"><div class="sb-num"><b class="num">' + st + '</b><span>' + (st === 1 ? "يوم كامل" : "أيام كاملة") + '</span></div><p class="sb-sub">' + esc(sub) + "</p></div></div>" +
      '<div class="sb-div"></div>' +
      '<div class="sb-col sb-ot"><div class="sb-num"><b class="num">' + stOT + '</b><span>' + (stOT === 1 ? "يوم في الوقت" : "أيام في الوقت") + '</span></div>' +
      (bestOT > stOT ? '<p class="sb-sub muted">أفضل ' + bestOT + '</p>' : "") + "</div>" +
      (best > st ? '<div class="sb-best">أفضل<b class="num">' + best + "</b></div>" : "") + "</div>";
  }
  function togglePrayer(key, i) {
    var now = nowR(), st = status(key, i, now), d = state.days[key] || (state.days[key] = {}), k = PRAYERS[i].k;
    if (isDone(st)) { delete d[k]; saveDay(key); toast("تم التراجع عن تسجيل " + pname(key, i)); render(); return; }
    if (st === "upcoming" || st === "future" || st === "na") return;
    var late = (key === now.key && st === "missed");
    d[k] = { t: now.ms };
    if (key < now.key) d[k].qada = 1; else if (late) d[k].late = 1;
    saveDay(key); render();
    toast(key < now.key ? "سُجّل قضاء " + pname(key, i) : (late ? "سُجّلت " + pname(key, i) + " بعد وقتها" : "تقبّل الله طاعتك"));
  }
  function missedList(now) {
    var out = [], k = state.settings.startDate, guard = 0;
    while (k <= now.key && guard++ < 800) {
      for (var i = 0; i < 5; i++) if (status(k, i, now) === "missed") out.push({ key: k, i: i });
      k = addDays(k, 1);
    }
    return out;
  }


  /* ---------------- quran logic ---------------- */
  function target() { var u = UNITS[state.settings.unit] || UNITS.page; return Math.max(1, Math.round(state.settings.amount * u.f)); }
  function pagesOn(key) { var d = state.days[key]; return d && d.q ? d.q : 0; }
  function totalPages() { var t = 0; for (var k in state.days) t += (state.days[k].q || 0); return t; }
  function juzOf(p) { return Math.min(30, p <= 21 ? 1 : Math.floor((p - 2) / 20) + 1); }
  function addPages(n) {
    var key = nowR().key, d = state.days[key] || (state.days[key] = {});
    d.q = Math.max(0, (d.q || 0) + n);
    saveDay(key, 500); render();
  }
  function setPages(n) { var key = nowR().key, d = state.days[key] || (state.days[key] = {}); d.q = Math.max(0, n); saveDay(key, 500); render(); }


  function prayerView(now) {
    if (state.az) return azkarListHTML(state.az);
    var pv = state.pv;
    // The streak banner and the prayer-times ring used to also sit on the home screen —
    // they now live only here, as this section's own header, since the home "خطة اليوم"
    // card already summarizes today's prayer count in one line.
    var top = pv === "today" ? streakBannerHTML(now) + heroHTML(now) : "";
    return top + '<div class="seg2 two" style="margin-block:6px 12px"><button data-act="pv" data-v="today" aria-pressed="' + (pv === "today") + '">اليوم</button><button data-act="pv" data-v="archive" aria-pressed="' + (pv === "archive") + '">الأرشيف والفائت</button></div>' +
      (pv === "archive" ? archiveView(now) : alertHTML(now) + azkarEntryCardHTML() + prayersHTML(now));
  }
  function azkarEntryCardHTML() {
    return '<div class="card"><h3>الأذكار</h3><p class="muted" style="font-size:14px;margin-block:4px 10px">أذكار الصباح والمساء من حصن المسلم</p><div class="row wrapr">' +
      '<button class="btn" data-act="azkar-open" data-k="morning">🌅 أذكار الصباح</button>' +
      '<button class="btn alt" data-act="azkar-open" data-k="evening">🌙 أذكار المساء</button></div></div>';
  }
  // Only one not-yet-finished dhikr is shown "open" (full text + note) at a time; the
  // rest sit collapsed to a single line. Finishing the open one auto-advances the focus
  // to the next not-done item — reading one thing at a time instead of scanning a long
  // flat list for where you left off.
  function azkarListHTML(key) {
    var list = AZKAR[key];
    var prog = state.azProgress[key];
    if (!prog || prog.length !== list.length) prog = state.azProgress[key] = list.map(function (it) { return it.n; });
    if (!state.azOpen) state.azOpen = {};
    var openIdx = state.azOpen[key];
    if (openIdx == null || prog[openIdx] == null || prog[openIdx] <= 0) {
      openIdx = prog.findIndex(function (c) { return c > 0; });
      state.azOpen[key] = openIdx;
    }
    var doneCount = prog.filter(function (c) { return c <= 0; }).length;
    var pct = list.length ? Math.round(doneCount / list.length * 100) : 0;
    var items = list.map(function (it, i) {
      var left = prog[i], done = left <= 0, open = i === openIdx;
      return '<button class="azcard' + (done ? " done" : (!open ? " collapsed" : "")) + '" data-act="azkar-tap" data-k="' + key + '" data-i="' + i + '"' + (done ? " disabled" : "") + '><p class="az-text">' + esc(it.t) + "</p>" +
        (it.note && (open || done) ? '<p class="az-note muted">' + esc(it.note) + "</p>" : "") +
        '<span class="az-count">' + (done ? "✓" : left) + "</span></button>";
    }).join("");
    return '<button class="linkbtn" data-act="azkar-close">← رجوع</button><div class="card"><div class="row between"><h2 style="margin:0">' + (key === "morning" ? "أذكار الصباح" : "أذكار المساء") + '</h2><span class="chip">' + doneCount + " / " + list.length + '</span></div>' +
      '<div class="bar" style="margin-block-start:10px"><i style="width:' + pct + '%"></i></div>' +
      '<p class="muted" style="font-size:13px;margin-block-start:6px">اضغط على الذكر كل ما قلته مرة، للعدّاد يوصل صفر</p></div>' + items +
      '<button class="btn alt" data-act="azkar-reset" data-k="' + key + '" style="width:100%;margin-block-start:4px">إعادة البدء</button>';
  }

  function archiveView(now) {
    var s7 = 0, p7 = 0, ontime = 0, total = 0, allp = 0, qada = 0, key;
    var start = state.settings.startDate;
    for (var d = 0; d < 30; d++) {
      key = addDays(now.key, -d);
      for (var i = 0; i < 5; i++) {
        var st = status(key, i, now);
        if (st === "na" || st === "future" || st === "upcoming" || st === "current") continue;
        allp++; if (isDone(st)) total++;
        if (st === "done") ontime++;
        if (d < 7) { p7++; if (isDone(st)) s7++; }
      }
    }
    for (var k in state.days) for (var j = 0; j < 5; j++) { var r = state.days[k][PRAYERS[j].k]; if (r && r.qada) qada++; }
    var pct7 = p7 ? Math.round(s7 / p7 * 100) : 0, pct30 = allp ? Math.round(total / allp * 100) : 0;
    var rows = "", tgt = target();
    for (var n = 0; n < state.archiveN; n++) {
      key = addDays(now.key, -n);
      if (key < start && n > 0) break;
      var cells = "";
      for (var q = 0; q < 5; q++) {
        var s = status(key, q, now), sym = isDone(s) ? "✓" : (s === "missed" ? "✕" : "·");
        cells += '<td><button class="dot ' + s + '" data-act="tp" data-d="' + key + '" data-p="' + q + '" aria-label="' + esc(pname(key, q)) + '"' + (s === "upcoming" || s === "future" || s === "na" ? " disabled" : "") + ">" + sym + "</button></td>";
      }
      var pq = pagesOn(key), qcls = pq >= tgt ? "done" : (pq > 0 ? "late" : (key < start || key > now.key ? "na" : "missed"));
      cells += '<td><span class="dot ' + qcls + '" style="cursor:default">' + (pq > 0 ? pq : (qcls === "missed" ? "✕" : "·")) + "</span></td>";
      var pp = key.split("-");
      rows += '<tr class="' + (key === now.key ? "today" : "") + '"><td class="day">' + WD_S[dowOf(key)] + " " + Number(pp[2]) + "/" + Number(pp[1]) + "</td>" + cells + "</tr>";
    }
    var canMore = addDays(now.key, -state.archiveN) >= start;
    return head(now) +
      '<div class="stats"><div class="stat"><b class="num">' + streak(now) + '</b><span>سلسلة الأيام الكاملة</span></div>' +
      '<div class="stat"><b class="num">' + bestStreak() + '</b><span>أفضل سلسلة</span></div>' +
      '<div class="stat"><b class="num">' + pct7 + '%</b><span>التزام آخر 7 أيام</span></div>' +
      '<div class="stat"><b class="num">' + pct30 + '%</b><span>التزام آخر 30 يومًا</span></div>' +
      '<div class="stat"><b class="num">' + (allp ? Math.round(ontime / allp * 100) : 0) + '%</b><span>في الوقت (30 يومًا)</span></div>' +
      '<div class="stat"><b class="num">' + qada + '</b><span>صلوات قضاء</span></div></div>' +
      '<div class="tw"><table><thead><tr><th style="text-align:start;padding-inline-start:10px">اليوم</th><th>فجر</th><th>ظهر</th><th>عصر</th><th>مغرب</th><th>عشاء</th><th>ورد</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<div class="legend"><span><i style="background:var(--done)"></i>في وقتها</span><span><i style="background:var(--amber)"></i>قضاء أو بعد الوقت</span><span><i style="background:var(--miss)"></i>فاتت</span></div>' +
      '<p class="muted" style="font-size:14px">اضغط أي خانة فاتت لتسجيل قضائها. واضغط خانة مسجّلة للتراجع.</p>' +
      (canMore ? '<div class="row" style="margin-block:10px"><button class="btn alt" data-act="more">عرض أيام أقدم</button></div>' : "") +
      '<div class="card" style="margin-block-start:12px"><h3>بداية التتبع</h3><p class="muted" style="font-size:14px">الصلوات قبل هذا التاريخ لا تُحسب فائتة. غيّره لو عايز تراجع أيام أقدم.</p>' +
      '<label class="field">التاريخ<input type="date" id="startdate" value="' + esc(start) + '" max="' + now.key + '"></label></div>';
  }

  function quranView(now) {
    var S = state.settings, u = UNITS[S.unit] || UNITS.page, t = target(), n = pagesOn(now.key);
    var tot = totalPages(), absolute = (S.startPage - 1) + tot, cur = (absolute % 604) + 1, khat = Math.floor(absolute / 604);
    var remain = 604 - (cur - 1), eta = Math.ceil(remain / t), wk = "", i, max = t;
    var days = [], weekAllZero = true;
    for (i = 6; i >= 0; i--) { var k = addDays(now.key, -i); var v = pagesOn(k); days.push({ k: k, v: v }); if (v > max) max = v; if (v > 0) weekAllZero = false; }
    days.forEach(function (d) {
      wk += '<div><span class="col"><i class="' + (d.v >= t ? "full" : "") + '" style="height:' + Math.round(d.v / max * 100) + '%"></i></span><b class="num" style="font-weight:500">' + d.v + "</b><span>" + WD_S[dowOf(d.k)] + "</span></div>";
    });
    var opts = Object.keys(UNITS).map(function (k) { return '<button data-act="unit" data-u="' + k + '" aria-pressed="' + (S.unit === k) + '">' + UNITS[k].n + "</button>"; }).join("");
    // One continuous 1→604 bar with a marker at the current position, instead of a bare
    // "وصلت لصفحة" number — "where am I in the whole Quran" reads faster as a single bar
    // than as a stat tile among four others.
    var khatmaPct = Math.max(0, Math.min(100, Math.round(((cur - 1) / 604) * 100)));
    var khatmaHTML = '<div class="card"><h3 style="margin:0 0 10px">الختمة الحالية</h3>' +
      '<div class="bar khatma"><i style="width:' + khatmaPct + '%"></i></div>' +
      '<p class="muted" style="font-size:13px;margin-block-start:10px">الجزء ' + juzOf(cur) + ' · باقي ' + eta + ' يوم بالمعدل الحالي</p></div>';
    return head(now) +
      '<div class="card"><div class="row between"><h2>وردي اليوم</h2><span class="chip num">' + n + " / " + t + ' صفحة</span></div>' +
      '<div class="bar"><i style="width:' + Math.min(100, Math.round(n / t * 100)) + '%"></i></div>' +
      '<div class="row wrapr" style="margin-block-start:12px"><button class="btn sm" data-act="pg" data-n="1">+1 صفحة</button><button class="btn sm" data-act="pg" data-n="5">+5</button><button class="btn sm" data-act="pg" data-n="10">+10</button>' +
      '<button class="btn sm alt" data-act="pgdone">أتممت وردي</button><button class="btn sm alt" data-act="pg" data-n="-1">−1</button></div></div>' +
      khatmaHTML +
      '<div class="stats"><div class="stat"><b class="num">' + khat + '</b><span>ختمات مكتملة</span></div>' +
      '<div class="stat"><b class="num">' + tot + '</b><span>مجموع الصفحات المقروءة</span></div></div>' +
      '<div class="card"><h3>آخر 7 أيام</h3>' + (weekAllZero
        ? '<p class="muted" style="font-size:14px;margin-block-start:8px">لسه مفيش وِرد مسجّل آخر 7 أيام.</p>'
        : '<div class="week">' + wk + "</div>") + "</div>" +
      '<div class="card"><h2>إعداد الورد</h2><div class="seg2">' + opts + "</div>" +
      '<div class="field">الكمية اليومية (' + u.n + ")<div class=\"stepper\"><button class=\"btn sm alt\" data-act=\"amt\" data-n=\"-1\">−</button><b class=\"num\">" + S.amount + "</b><button class=\"btn sm alt\" data-act=\"amt\" data-n=\"1\">+</button><span class=\"muted\">= " + t + " صفحة</span></div></div>" +
      '<label class="field">بدأت من صفحة<input type="number" id="startpage" min="1" max="604" value="' + S.startPage + '" inputmode="numeric"></label></div>';
  }
