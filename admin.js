"use strict";
  /* ---------------- admin dashboard ---------------- */
  var ADMIN_FN_URL = CFG.url + "/functions/v1/admin-change-password";
  var ACCOUNT_COLORS = ["#0E9F6E", "#3D6BF0", "#F59E0B", "#E2477A", "#7B61F0", "#14A3B8"];
  var ADM_FOLLOWUP_DAYS = 3; // no activity for this many days or more -> "needs follow-up"
  var ADM_SECTION_LABEL = { prayer: "الصلاة", quran: "القرآن", learn: "التعلّم", exp: "الحاسبة" };
  function accColor(i) { return ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]; }
  function initialsOf(label) {
    var parts = (label || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "؟";
    return parts[0].slice(0, 1);
  }
  function statTile(label, val) {
    return '<div style="min-width:130px;margin:6px 0"><div class="muted" style="font-size:12.5px">' + esc(label) + '</div><div class="num" style="font-size:19px;font-weight:700">' + esc(String(val)) + "</div></div>";
  }
  /* -- raw-days helpers: the admin works over OTHER accounts' days/learn objects,
     never the logged-in state.days, so these take `days`/`learn` as plain args
     instead of reading global state the way the main app's own streak()/status() do. */
  function admDayComplete(days, key) {
    var d = days[key];
    return !!d && PRAYERS.every(function (p) { return d[p.k] && d[p.k].t; });
  }
  function admDayActivity(days, key) {
    var d = days[key]; if (!d) return 0;
    var n = PRAYERS.filter(function (p) { return d[p.k] && d[p.k].t; }).length;
    if (n === 0 && !(d.q > 0)) return 0;
    return n >= 5 ? 2 : 1;
  }
  function admStreak(days, now) {
    var k = now.key, n = 0;
    if (!admDayComplete(days, k)) k = addDays(k, -1);
    while (admDayComplete(days, k) && n < 5000) { n++; k = addDays(k, -1); }
    return n;
  }
  function admLastActiveKey(days) {
    var keys = Object.keys(days).filter(function (k) { return admDayActivity(days, k) > 0; }).sort();
    return keys.length ? keys[keys.length - 1] : null;
  }
  function admDaysSince(key, now) {
    if (!key) return null;
    var p = key.split("-").map(Number), q = now.key.split("-").map(Number);
    var a = Date.UTC(p[0], p[1] - 1, p[2]), b = Date.UTC(q[0], q[1] - 1, q[2]);
    return Math.round((b - a) / 86400000);
  }
  function admAllowedCourses(acc) {
    return (Array.isArray(acc.courses) && acc.courses.length) ? withComplements(COURSE_ORDER.filter(function (c) { return acc.courses.indexOf(c) >= 0; })) : COURSE_ORDER.slice();
  }
  function admAllowedSections(acc) {
    return (Array.isArray(acc.sections) && acc.sections.length) ? acc.sections.slice() : TOGGLEABLE_SECTIONS.slice();
  }
  function admWeekBars(days, now) {
    var out = "";
    for (var i = 6; i >= 0; i--) {
      var k = addDays(now.key, -i), d = days[k], n = d ? PRAYERS.filter(function (p) { return d[p.k] && d[p.k].t; }).length : 0;
      out += '<div><span class="col"><i class="' + (n === 5 ? "full" : "") + '" style="height:' + Math.round(n / 5 * 100) + '%"></i></span><b class="num" style="font-weight:500">' + n + "</b><span>" + WD_S[dowOf(k)] + "</span></div>";
    }
    return out;
  }
  // Real weekly learning minutes, from learn.minutes (see tick() above) — 0 for any
  // account that hasn't opened the "تعلّم" tab since this feature shipped, which is
  // honest: there is no historical minutes data to back-fill.
  function admWeekMinutes(learn, now) {
    var mins = (learn && learn.minutes) || {}, total = 0;
    for (var i = 0; i < 7; i++) total += mins[addDays(now.key, -i)] || 0;
    return total;
  }
  // "الهدف اتحقق Y/7 أيام": a day counts if minutes that day met the account's admin-set
  // daily goal; accounts with no goal set (dailyGoalMin falsy) fall back to "any study
  // activity that day at all" so the line still means something before a goal exists.
  function admGoalDaysHit(acc, learn, now) {
    var goal = (acc && acc.dailyGoalMin) || 0;
    var mins = (learn && learn.minutes) || {}, study = (learn && learn.study) || {}, hit = 0;
    for (var i = 0; i < 7; i++) {
      var k = addDays(now.key, -i);
      if (goal > 0 ? (mins[k] || 0) >= goal : (study[k] || 0) > 0) hit++;
    }
    return hit;
  }
  // Average of each attempted unit's best quiz score — the richest existing "how well
  // is this account doing" number until Phase 8 adds a dedicated weak-points model.
  function admAvgQuizScore(learn) {
    var units = (learn && learn.units) || {}, vals = [];
    Object.keys(units).forEach(function (k) { if (typeof units[k].best === "number") vals.push(units[k].best); });
    if (!vals.length) return null;
    return Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length);
  }
  function admMistakeCount(learn) { return Object.keys((learn && learn.mistakes) || {}).length; }
  var ADM_FILTERS = [{ id: "week", label: "الأسبوع ده", n: 7 }, { id: "month", label: "الشهر ده", n: 30 }, { id: "all", label: "الكل", n: 36500 }];
  function admFilterDef() { return ADM_FILTERS.filter(function (f) { return f.id === (state.adminFilter || "week"); })[0] || ADM_FILTERS[0]; }
  // Period stats for one account: prayer/Quran/XP totals over the filtered window,
  // plus per-course progress — each course's total/done counted only within that
  // account's own allowed-course set when it's restricted (locked courses still
  // appear in the list, dimmed, so the admin can see what's hidden from them).
  function admPeriodStats(acc, days, learn, now, f) {
    var prayDone = 0, prayTotal = 0, pages = 0, xp = 0, completeDays = 0, n = f.n;
    if (f.id === "all") {
      // "all time" means since this account's own earliest recorded day, not a
      // fixed huge window — otherwise the denominator would include years before
      // the account even existed and make its percentage look artificially bad.
      var keys = Object.keys(days).sort();
      n = keys.length ? Math.max(1, admDaysSince(keys[0], now) + 1) : 1;
    }
    for (var i = 0; i < n; i++) {
      var k = addDays(now.key, -i), d = days[k];
      var pd = d ? PRAYERS.filter(function (p) { return d[p.k] && d[p.k].t; }).length : 0;
      prayDone += pd; prayTotal += 5; if (pd === 5) completeDays++;
      pages += (d && d.q) || 0;
      xp += (learn.study && learn.study[k]) || 0;
    }
    var allowed = admAllowedCourses(acc);
    var courses = COURSE_ORDER.map(function (cid) {
      var c = COURSES[cid]; if (!c) return null;
      var done = c.units.filter(function (u) { return ((learn.units || {})[cid + ":" + u.id] || {}).done; }).length;
      var lastDate = null;
      c.units.forEach(function (u) { var p = (learn.units || {})[cid + ":" + u.id]; if (p && p.date && (!lastDate || p.date > lastDate)) lastDate = p.date; });
      return { cid: cid, title: c.title, done: done, total: c.units.length, allowed: allowed.indexOf(cid) >= 0, lastDate: lastDate };
    }).filter(Boolean);
    return { prayDone: prayDone, prayTotal: prayTotal, pages: pages, xp: xp, completeDays: completeDays, courses: courses };
  }
  async function adminFnCall(payload) {
    var sess = await store.sb.auth.getSession();
    var token = sess.data && sess.data.session && sess.data.session.access_token;
    if (!token) return { error: "انتهت الجلسة، سجّل دخول تاني." };
    try {
      var res = await fetch(ADMIN_FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, "apikey": CFG.key },
        body: JSON.stringify(payload)
      });
      var j = await res.json().catch(function () { return {}; });
      if (!res.ok || j.error) return { error: j.error || String(res.status) };
      return { ok: true, data: j };
    } catch (e) { return { error: "تعذّر الاتصال." }; }
  }
  async function adminChangePassword(form) {
    var uid = form.getAttribute("data-uid");
    var input = form.querySelector("input");
    var msgEl = form.querySelector(".pwmsg");
    var newPin = (input.value || "").trim();
    if (!/^\d{4,8}$/.test(newPin)) { msgEl.textContent = "لازم يكون رقم من 4 لـ 8 خانات."; return; }
    msgEl.textContent = "جارٍ التغيير…";
    var r = await adminFnCall({ action: "changePassword", targetUid: uid, newPin: newPin });
    if (r.error) { msgEl.textContent = "تعذّر: " + r.error; return; }
    msgEl.textContent = "تم التغيير ✓"; input.value = "";
  }
  async function adminToggleActive(uid, nextActive) {
    var r = await adminFnCall({ action: "setActive", targetUid: uid, active: nextActive });
    if (r.error) return r;
    await loadAccountsList();
    await loadAdminDashboard();
    return r;
  }
  async function adminCreateAccount(form) {
    var labelInput = form.querySelector('[name="label"]');
    var pinInput = form.querySelector('[name="pin"]');
    var msgEl = form.querySelector(".createmsg");
    var label = (labelInput.value || "").trim();
    var pin = (pinInput.value || "").trim();
    if (!label) { msgEl.textContent = "لازم اسم للحساب."; return; }
    if (!/^\d{4,8}$/.test(pin)) { msgEl.textContent = "لازم رمز من 4 لـ 8 خانات."; return; }
    msgEl.textContent = "جارٍ الإضافة…";
    var r = await adminFnCall({ action: "create", label: label, pin: pin });
    if (r.error) { msgEl.textContent = "تعذّر: " + r.error; return; }
    labelInput.value = ""; pinInput.value = "";
    msgEl.textContent = "تمت الإضافة ✓";
    await loadAccountsList();
    await loadAdminDashboard();
  }
  // Writes courses/sections for one account. This calls the SAME edge function as
  // changePassword/setActive/create (consistent with how every other admin write in
  // this app is already secured) via a new "setPermissions" action. Until that
  // action is deployed server-side, this fails with a clear "needs an update" message
  // instead of silently doing nothing.
  async function adminSetPermissions(uid, courses, sections) {
    return adminFnCall({ action: "setPermissions", targetUid: uid, courses: courses, sections: sections });
  }
  // Per-account daily goal (minutes) + daily new-word limit, set from "الصلاحيات".
  // 0/empty means "no admin-set value" on both — Phase 7's SRS daily cap and
  // admGoalDaysHit() both already treat 0 as "use the default" rather than "zero".
  async function adminSetGoals(uid, dailyGoalMin, dailyNewWordLimit) {
    return adminFnCall({ action: "setAccountGoals", targetUid: uid, dailyGoalMin: dailyGoalMin, dailyNewWordLimit: dailyNewWordLimit });
  }
  // One-off push reminder via the account's existing masar_push_subs subscription(s)
  // (the same ones enablePush()/disablePush() manage) — server-side only, since
  // sending a real Web Push message needs the project's VAPID private key, which
  // never belongs in client code.
  async function adminSendReminder(uid, message) {
    return adminFnCall({ action: "sendReminder", targetUid: uid, message: message });
  }
  /* ---------------- dashboard UI ---------------- */
  // Single-page admin console: sidebar (desktop) / sticky top nav (mobile), six
  // views, one delegated click handler. Only uses the edge-function actions that
  // already exist (getDashboardData, create, changePassword, setActive,
  // setPermissions, setAccountGoals, sendReminder), so it needs no server change.
  var ADM = { stats: [], raw: null, at: 0, q: "", lfilter: "all", sort: "last", range: 14, metric: "pray", sub: "activity", nTo: "follow", nPick: {}, nTpl: 0, nCustom: "", addOpen: false, sending: false };
  var ADM_ICO = {
    overview: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
    accounts: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    compare: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    notify: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
    reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'
  };
  function admIco(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ADM_ICO[k] + "</svg>"; }
  var ADM_NAV = [
    { id: "overview", label: "نظرة عامة" }, { id: "accounts", label: "الحسابات" }, { id: "profile", label: "ملف الحساب" },
    { id: "compare", label: "مقارنة" }, { id: "notify", label: "الإشعارات" }, { id: "reports", label: "التقارير" }
  ];
  var ADM_METRICS = [
    { id: "pray", label: "الصلوات" }, { id: "pages", label: "صفحات القرآن" }, { id: "xp", label: "نقاط التعلّم" }, { id: "mins", label: "دقايق التعلّم" }
  ];
  var ADM_TPL = [
    "فاتك تذاكر النهاردة في مسار — افتح التطبيق وكمّل 💪",
    "متنساش وردك من القرآن النهاردة 📖",
    "سجّل صلواتك في مسار عشان سلسلتك متقفش 🕌",
    "إنت ماشي كويس جدًا، كمّل كده! ✨"
  ];
  var ADM_GAME_LBL = { match: "مطابقة", sprint: "سباق 60 ثانية", listen: "اسمع واختار", spell: "تهجئة" };

  /* metrics */
  function admM(st, k) {
    var d = st.days[k] || {};
    return { pray: PRAYERS.filter(function (p) { return d[p.k] && d[p.k].t; }).length, pages: d.q || 0, xp: (st.learn.study || {})[k] || 0, mins: (st.learn.minutes || {})[k] || 0 };
  }
  function admAny(m) { return m.pray > 0 || m.pages > 0 || m.xp > 0 || m.mins > 0; }
  function admWin(st, now, from, n) {
    var t = { pray: 0, pages: 0, xp: 0, mins: 0, active: 0, full: 0 };
    for (var i = from; i < from + n; i++) {
      var m = admM(st, addDays(now.key, -i));
      t.pray += m.pray; t.pages += m.pages; t.xp += m.xp; t.mins += m.mins;
      if (admAny(m)) t.active++; if (m.pray === 5) t.full++;
    }
    return t;
  }
  function admLastAny(st) {
    var keys = Object.keys(st.days).concat(Object.keys(st.learn.study || {}), Object.keys(st.learn.minutes || {}));
    var best = null;
    keys.forEach(function (k) { if ((!best || k > best) && admAny(admM(st, k))) best = k; });
    return best;
  }
  function admStatus(st, now) {
    if (st.acc.active === false) return { k: "off", t: "معطّل" };
    var since = admDaysSince(admLastAny(st), now);
    if (since === 0) return { k: "on", t: "نشط النهارده", since: 0 };
    if (since !== null && since < ADM_FOLLOWUP_DAYS) return { k: "warm", t: since === 1 ? "نشط امبارح" : "نشط من " + fmtDaysAr(since), since: since };
    return { k: "cold", t: since === null ? "من غير نشاط" : "غايب " + fmtDaysAr(since), since: since };
  }
  function admEnabled() { return ADM.stats.filter(function (s) { return s.acc.active !== false; }); }
  function admFindSt(uid) { return ADM.stats.filter(function (s) { return s.acc.uid === uid; })[0] || null; }
  function admIdx(st) { return ADM.stats.indexOf(st); }
  function admLevel(xp) { return Math.floor(Math.sqrt((xp || 0) / 40)) + 1; }

  /* small UI pieces */
  function admAv(st, size) {
    var c = accColor(admIdx(st));
    return '<span class="adm-av" style="--ac:' + c + (size ? ";--sz:" + size + "px" : "") + '">' + esc(initialsOf(st.acc.label)) + "</span>";
  }
  function admPill(s) { return '<span class="adm-pill ' + s.k + '"><i></i>' + esc(s.t) + "</span>"; }
  function admDelta(cur, prev) {
    if (!prev && !cur) return '<span class="adm-delta">—</span>';
    if (!prev) return '<span class="adm-delta up">جديد</span>';
    var pct = Math.round((cur - prev) / prev * 100);
    return '<span class="adm-delta ' + (pct > 0 ? "up" : pct < 0 ? "down" : "") + '">' + (pct > 0 ? "▲ " : pct < 0 ? "▼ " : "") + '<span class="num">' + Math.abs(pct) + "%</span></span>";
  }
  function admKpi(label, val, delta, hint) {
    return '<div class="adm-kpi"><span class="adm-kpi-l">' + esc(label) + '</span><b class="num">' + val + "</b>" + (delta || "") + (hint ? '<small class="muted">' + esc(hint) + "</small>" : "") + "</div>";
  }
  function admSeg(name, items, cur) {
    return '<div class="adm-seg">' + items.map(function (it) {
      return '<button data-adm="' + name + '" data-v="' + it.id + '" aria-pressed="' + (String(it.id) === String(cur)) + '">' + esc(it.label) + "</button>";
    }).join("") + "</div>";
  }
  function admEmpty(t) { return '<div class="card adm-empty">' + esc(t) + "</div>"; }
  function fmtShort(k) { var p = k.split("-"); return Number(p[2]) + "/" + Number(p[1]); }
  function fmtRel(k, now) {
    var n = admDaysSince(k, now);
    return n === 0 ? "النهارده" : n === 1 ? "امبارح" : n === 2 ? "من يومين" : greg(k);
  }

  /* charts */
  function admLineChart(series, keys) {
    var W = 640, H = 220, pl = 34, pr = 10, pt = 14, pb = 26, iw = W - pl - pr, ih = H - pt - pb;
    var max = 1; series.forEach(function (s) { s.v.forEach(function (v) { if (v > max) max = v; }); });
    max = Math.ceil(max * 1.1);
    var n = keys.length, x = function (i) { return pl + (n === 1 ? iw / 2 : i * iw / (n - 1)); }, y = function (v) { return pt + ih - v / max * ih; };
    var grid = "";
    for (var g = 0; g <= 4; g++) {
      var gv = Math.round(max * g / 4), gy = y(gv);
      grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" class="adm-grid"/><text x="' + (pl - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" class="adm-axis">' + gv + "</text>";
    }
    var step = Math.max(1, Math.ceil(n / 7)), xl = "";
    keys.forEach(function (k, i) { if ((n - 1 - i) % step === 0) xl += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="adm-axis">' + fmtShort(k) + "</text>"; });
    var defs = "", body = "";
    series.forEach(function (s, si) {
      var pts = s.v.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1); });
      defs += '<linearGradient id="admg' + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.c + '" stop-opacity=".28"/><stop offset="1" stop-color="' + s.c + '" stop-opacity="0"/></linearGradient>';
      body += '<path d="M' + x(0).toFixed(1) + "," + (pt + ih) + " L" + pts.join(" L") + " L" + x(n - 1).toFixed(1) + "," + (pt + ih) + ' Z" fill="url(#admg' + si + ')"/>' +
        '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + s.c + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
        s.v.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === n - 1 ? 4 : 2.2) + '" fill="' + s.c + '"><title>' + esc(s.label) + " · " + fmtShort(keys[i]) + ": " + v + "</title></circle>"; }).join("");
    });
    return '<svg class="adm-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="رسم بياني للنشاط"><defs>' + defs + "</defs>" + grid + xl + body + "</svg>";
  }
  function admSpark(st, now, n) {
    var v = [], W = 96, H = 30;
    for (var i = n - 1; i >= 0; i--) { var m = admM(st, addDays(now.key, -i)); v.push(m.pray + Math.min(m.pages, 5) + (m.xp > 0 ? 2 : 0)); }
    var max = Math.max.apply(null, v.concat([1]));
    var pts = v.map(function (val, i) { return (i * W / (n - 1)).toFixed(1) + "," + (H - 2 - val / max * (H - 4)).toFixed(1); }).join(" ");
    return '<svg class="adm-spark" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="' + accColor(admIdx(st)) + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function admHeat(st, now) {
    var cells = "";
    for (var i = 34; i >= 0; i--) {
      var k = addDays(now.key, -i), m = admM(st, k), lv = m.pray === 5 ? 3 : m.pray > 0 ? 2 : 0;
      if (m.xp > 0 || m.pages > 0) lv = Math.min(4, lv + 1);
      cells += '<i class="h' + lv + '" title="' + esc(greg(k) + " · صلوات " + m.pray + "/5 · صفحات " + m.pages + " · XP " + m.xp) + '"></i>';
    }
    return '<div class="adm-heat">' + cells + '</div><div class="adm-heat-l"><span>أقل</span><i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><span>أكتر</span></div>';
  }

  /* views */
  function admOverview(now) {
    var en = admEnabled(), n = ADM.range;
    if (!ADM.stats.length) return admEmpty("مفيش حسابات لسه. ضيف أول حساب من صفحة «الحسابات».");
    var cur = { pray: 0, pages: 0, xp: 0, mins: 0, act: 0 }, prev = { pray: 0, pages: 0, xp: 0, mins: 0, act: 0 }, follow = [];
    en.forEach(function (st) {
      var a = admWin(st, now, 0, n), b = admWin(st, now, n, n);
      ["pray", "pages", "xp", "mins"].forEach(function (k) { cur[k] += a[k]; prev[k] += b[k]; });
      if (a.active) cur.act++; if (b.active) prev.act++;
      var s = admStatus(st, now); if (s.k === "cold") follow.push({ st: st, s: s });
    });
    var denom = Math.max(1, en.length * n * 5);
    var kpis = '<div class="adm-kpis">' +
      admKpi("حسابات نشطة", cur.act + '<small class="muted">/' + en.length + "</small>", admDelta(cur.act, prev.act)) +
      admKpi("التزام الصلاة", Math.round(cur.pray / denom * 100) + "%", admDelta(cur.pray, prev.pray), cur.pray + " صلاة") +
      admKpi("صفحات القرآن", cur.pages, admDelta(cur.pages, prev.pages)) +
      admKpi("نقاط التعلّم", cur.xp, admDelta(cur.xp, prev.xp)) +
      admKpi("دقايق التعلّم", cur.mins, admDelta(cur.mins, prev.mins)) +
      admKpi("محتاج متابعة", follow.length, "", "غايب " + ADM_FOLLOWUP_DAYS + " أيام أو أكتر") + "</div>";
    var keys = []; for (var i = n - 1; i >= 0; i--) keys.push(addDays(now.key, -i));
    var series = en.map(function (st) { return { label: st.acc.label, c: accColor(admIdx(st)), v: keys.map(function (k) { return admM(st, k)[ADM.metric]; }) }; });
    var chart = '<div class="card"><div class="adm-card-h"><h3>النشاط اليومي</h3>' + admSeg("metric", ADM_METRICS, ADM.metric) + "</div>" +
      (series.length ? admLegend(en) + admLineChart(series, keys) : '<p class="muted">مفيش حسابات مفعّلة.</p>') + "</div>";
    var board = en.map(function (st) { return { st: st, xp: admWin(st, now, 0, n).xp }; }).sort(function (a, b) { return b.xp - a.xp; });
    var topXp = Math.max(1, board.length ? board[0].xp : 1);
    var leader = '<div class="card"><div class="adm-card-h"><h3>🏆 لوحة الشرف</h3><small class="muted">نقاط آخر ' + n + " يوم</small></div>" +
      (board.length ? board.map(function (b, i) {
        return '<button class="adm-lrow" data-adm="open" data-uid="' + esc(b.st.acc.uid) + '"><span class="adm-rank">' + (["🥇", "🥈", "🥉"][i] || i + 1) + "</span>" + admAv(b.st, 30) +
          '<span class="grow"><b>' + esc(b.st.acc.label) + '</b><span class="adm-mini"><i style="width:' + Math.round(b.xp / topXp * 100) + "%;background:" + accColor(admIdx(b.st)) + '"></i></span></span><b class="num">' + b.xp + "</b></button>";
      }).join("") : '<p class="muted">—</p>') + "</div>";
    var alerts = '<div class="card"><div class="adm-card-h"><h3>⚠️ محتاج متابعة</h3>' + (follow.length ? '<button class="btn sm alt" data-adm="nav" data-v="notify">ذكّرهم كلهم</button>' : "") + "</div>" +
      (follow.length ? follow.map(function (f) {
        return '<div class="adm-lrow">' + admAv(f.st, 30) + '<span class="grow"><b>' + esc(f.st.acc.label) + "</b><br>" + admPill(f.s) + "</span>" +
          '<button class="btn sm alt" data-adm="remind" data-uid="' + esc(f.st.acc.uid) + '">🔔</button><button class="btn sm" data-adm="open" data-uid="' + esc(f.st.acc.uid) + '">شوف</button></div>';
      }).join("") : '<p class="adm-ok">✓ كل الحسابات متابعة كويس.</p>') + "</div>";
    return admHead("نظرة عامة", "ملخص كل الحسابات في آخر " + n + " يوم مقارنة بالفترة اللي قبلها", admSeg("range", [{ id: 7, label: "7 أيام" }, { id: 14, label: "14 يوم" }, { id: 30, label: "30 يوم" }], n)) +
      kpis + '<div class="adm-grid2"><div>' + chart + admFeed(now) + "</div><div>" + alerts + leader + "</div></div>";
  }
  function admLegend(list) {
    return '<div class="adm-legend">' + list.map(function (st) { return '<span><i style="background:' + accColor(admIdx(st)) + '"></i>' + esc(st.acc.label) + "</span>"; }).join("") + "</div>";
  }
  function admFeed(now) {
    var ev = [];
    ADM.stats.forEach(function (st) {
      for (var i = 0; i < 14; i++) {
        var k = addDays(now.key, -i), m = admM(st, k);
        if (m.pray === 5) ev.push({ k: k, st: st, ico: "🕌", t: "صلّى الخمس صلوات" });
        else if (m.pray > 0) ev.push({ k: k, st: st, ico: "🕌", t: "سجّل " + m.pray + " صلوات" });
        if (m.pages > 0) ev.push({ k: k, st: st, ico: "📖", t: "قرأ " + m.pages + " صفحة قرآن" });
      }
      Object.keys(st.learn.units || {}).forEach(function (uk) {
        var p = st.learn.units[uk], u = UNIT_BY_KEY[uk];
        if (p && p.done && p.date && admDaysSince(p.date, now) < 14) ev.push({ k: p.date, st: st, ico: "🎓", t: "خلّص وحدة «" + (u ? u.title : uk) + "»" + (p.best != null ? " بنتيجة " + p.best + "%" : ""), w: 1 });
      });
      Object.keys(st.learn.exam || {}).forEach(function (cid) {
        var e = st.learn.exam[cid];
        if (e && e.passed && e.date && admDaysSince(e.date, now) < 14) ev.push({ k: e.date, st: st, ico: "🏆", t: "نجح في الامتحان النهائي لـ «" + (COURSES[cid] ? COURSES[cid].title : cid) + "»", w: 2 });
      });
    });
    ev.sort(function (a, b) { return a.k < b.k ? 1 : a.k > b.k ? -1 : (b.w || 0) - (a.w || 0); });
    ev = ev.slice(0, 8);
    return '<div class="card"><div class="adm-card-h"><h3>آخر الأحداث</h3><small class="muted">آخر 14 يوم</small></div>' +
      (ev.length ? '<div class="adm-feed">' + ev.map(function (e) {
        return '<div class="adm-ev"><span class="adm-ev-ic">' + e.ico + '</span><span class="grow"><b>' + esc(e.st.acc.label) + "</b> " + esc(e.t) + '</span><small class="muted">' + esc(fmtRel(e.k, now)) + "</small></div>";
      }).join("") + "</div>" : '<p class="muted">مفيش أحداث لسه.</p>') + "</div>";
  }

  function admHead(title, sub, right) {
    return '<div class="adm-head"><div><h2>' + esc(title) + "</h2>" + (sub ? '<p class="muted">' + esc(sub) + "</p>" : "") + "</div>" + (right || "") + "</div>";
  }
  var ADM_LFILTERS = [{ id: "all", label: "الكل" }, { id: "on", label: "نشط النهارده" }, { id: "warm", label: "نشط مؤخرًا" }, { id: "cold", label: "محتاج متابعة" }, { id: "off", label: "معطّل" }];
  function admAccounts(now) {
    var counts = {}; ADM.stats.forEach(function (st) { var k = admStatus(st, now).k; counts[k] = (counts[k] || 0) + 1; });
    var filters = '<div class="adm-seg wrap">' + ADM_LFILTERS.map(function (f) {
      var c = f.id === "all" ? ADM.stats.length : (counts[f.id] || 0);
      return '<button data-adm="lfilter" data-v="' + f.id + '" aria-pressed="' + (ADM.lfilter === f.id) + '">' + esc(f.label) + ' <span class="num">' + c + "</span></button>";
    }).join("") + "</div>";
    return admHead("الحسابات", ADM.stats.length + " حساب · اضغط على أي حساب عشان تفتح ملفه", '<button class="btn" data-adm="addtoggle">' + (ADM.addOpen ? "إلغاء" : "+ حساب جديد") + "</button>") +
      (ADM.addOpen ? adminAddAccountCard() : "") +
      '<div class="adm-toolbar"><input class="inp" id="admQ" type="search" placeholder="دوّر باسم الحساب" value="' + esc(ADM.q) + '" autocomplete="off">' +
      '<select class="inp" id="admSort" aria-label="ترتيب"><option value="last"' + (ADM.sort === "last" ? " selected" : "") + '>آخر نشاط</option><option value="xp"' + (ADM.sort === "xp" ? " selected" : "") + '>الأكتر نقاط</option><option value="streak"' + (ADM.sort === "streak" ? " selected" : "") + '>أطول سلسلة</option><option value="name"' + (ADM.sort === "name" ? " selected" : "") + ">الاسم</option></select></div>" +
      filters + '<div id="admList">' + admAccountsList(now) + "</div>";
  }
  function admAccountsList(now) {
    var q = ADM.q.trim().toLowerCase();
    var list = ADM.stats.filter(function (st) {
      if (q && String(st.acc.label || "").toLowerCase().indexOf(q) < 0) return false;
      return ADM.lfilter === "all" || admStatus(st, now).k === ADM.lfilter;
    }).map(function (st) { return { st: st, s: admStatus(st, now), w: admWin(st, now, 0, 7), streak: admStreak(st.days, now) }; });
    list.sort(function (a, b) {
      if (ADM.sort === "name") return String(a.st.acc.label).localeCompare(String(b.st.acc.label), "ar");
      if (ADM.sort === "xp") return b.w.xp - a.w.xp;
      if (ADM.sort === "streak") return b.streak - a.streak;
      var as = a.s.since == null ? 9999 : a.s.since, bs = b.s.since == null ? 9999 : b.s.since;
      return (a.s.k === "off") - (b.s.k === "off") || as - bs;
    });
    if (!list.length) return admEmpty("مفيش حسابات بالشروط دي.");
    return list.map(function (r) {
      var st = r.st;
      return '<div class="card adm-acc' + (r.s.k === "off" ? " off" : "") + '">' +
        '<button class="adm-acc-main" data-adm="open" data-uid="' + esc(st.acc.uid) + '">' + admAv(st, 44) +
        '<span class="grow"><b>' + esc(st.acc.label) + "</b>" + admPill(r.s) + "</span>" + admSpark(st, now, 14) + "</button>" +
        '<div class="adm-acc-stats">' +
        "<span><b class=\"num\">" + Math.round(r.w.pray / 35 * 100) + "%</b><small>صلاة 7 أيام</small></span>" +
        "<span><b class=\"num\">" + r.streak + "</b><small>سلسلة</small></span>" +
        "<span><b class=\"num\">" + r.w.pages + "</b><small>صفحات</small></span>" +
        "<span><b class=\"num\">" + r.w.xp + "</b><small>نقاط</small></span></div>" +
        '<div class="adm-acc-act"><button class="btn sm alt" data-adm="remind" data-uid="' + esc(st.acc.uid) + '">🔔 تذكير</button>' +
        '<button class="btn sm alt" data-adm="open" data-uid="' + esc(st.acc.uid) + '" data-sub="perm">⚙️ صلاحيات</button>' +
        '<button class="btn sm alt" data-adm="open" data-uid="' + esc(st.acc.uid) + '" data-sub="security">🔑 الأمان</button></div></div>';
    }).join("");
  }

  var ADM_SUBS = [{ id: "activity", label: "النشاط" }, { id: "learn", label: "التعلّم" }, { id: "perm", label: "الصلاحيات" }, { id: "security", label: "الأمان" }];
  function admProfile(now) {
    var st = admFindSt(state.adminDetailUid) || ADM.stats[0];
    if (!st) return admEmpty("مفيش حسابات لسه.");
    state.adminDetailUid = st.acc.uid;
    var s = admStatus(st, now), last = admLastAny(st), learn = st.learn;
    var switcher = '<select class="inp" id="admSwitch" aria-label="اختار حساب">' + ADM.stats.map(function (x) {
      return '<option value="' + esc(x.acc.uid) + '"' + (x === st ? " selected" : "") + ">" + esc(x.acc.label) + "</option>";
    }).join("") + "</select>";
    var head = '<div class="card adm-prof" style="--ac:' + accColor(admIdx(st)) + '">' + admAv(st, 64) +
      '<div class="grow"><h2>' + esc(st.acc.label) + "</h2>" + admPill(s) +
      '<p class="muted" style="font-size:13px;margin-block-start:6px">' + (last ? "آخر نشاط: " + esc(greg(last)) : "لسه مفيش نشاط") +
      " · مستوى " + admLevel(learn.xp) + " · " + (learn.xp || 0) + " نقطة · سلسلة صلاة " + admStreak(st.days, now) + "</p></div>" +
      '<div class="adm-prof-act"><button class="btn sm" data-adm="remind" data-uid="' + esc(st.acc.uid) + '">🔔 تذكير</button></div></div>';
    var sub = ADM.sub;
    var body = sub === "learn" ? admProfLearn(st, now) : sub === "perm" ? admPermBody(st) : sub === "security" ? admSecurity(st) : admProfActivity(st, now);
    return admHead("ملف الحساب", "", switcher) + head + admSeg("sub", ADM_SUBS, sub) + body;
  }
  function admProfActivity(st, now) {
    var f = admFilterDef(), p = admPeriodStats(st.acc, st.days, st.learn, now, f);
    var pPct = p.prayTotal ? Math.round(p.prayDone / p.prayTotal * 100) : 0;
    var pages14 = "", maxP = 1;
    for (var j = 13; j >= 0; j--) maxP = Math.max(maxP, admM(st, addDays(now.key, -j)).pages);
    for (var i = 13; i >= 0; i--) {
      var k = addDays(now.key, -i), pg = admM(st, k).pages;
      pages14 += '<div title="' + esc(greg(k)) + ": " + pg + '"><span class="col"><i style="height:' + Math.round(pg / maxP * 100) + '%;background:var(--amber)"></i></span><span>' + fmtShort(k) + "</span></div>";
    }
    return admSeg("filter", ADM_FILTERS, f.id) +
      '<div class="adm-kpis k4">' + admKpi("الصلوات", p.prayDone + '<small class="muted">/' + p.prayTotal + "</small>", "", pPct + "% التزام") +
        admKpi("أيام كاملة", p.completeDays, "", "الخمس صلوات") + admKpi("صفحات القرآن", p.pages) + admKpi("نقاط التعلّم", "+" + p.xp) + "</div>" +
      '<div class="adm-grid2"><div class="card"><div class="adm-card-h"><h3>خريطة النشاط</h3><small class="muted">آخر 5 أسابيع</small></div>' + admHeat(st, now) + "</div>" +
      '<div class="card"><div class="adm-card-h"><h3>صلوات الأسبوع</h3></div><div class="week">' + admWeekBars(st.days, now) + "</div></div></div>" +
      '<div class="card"><div class="adm-card-h"><h3>صفحات القرآن</h3><small class="muted">آخر 14 يوم</small></div><div class="week adm-week14">' + pages14 + "</div></div>";
  }
  function admProfLearn(st, now) {
    var learn = st.learn, f = admFilterDef(), p = admPeriodStats(st.acc, st.days, learn, now, f), avg = admAvgQuizScore(learn);
    var courses = p.courses.map(function (c) {
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
      if (!c.allowed) return '<div class="adm-course off"><div class="row between"><span>' + esc(c.title) + '</span><span class="muted">مش مسموح</span></div></div>';
      return '<div class="adm-course"><div class="row between"><span>' + esc(c.title) + '</span><span class="num">' + c.done + "/" + c.total + " · " + pct + '%</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>' +
        (c.lastDate ? '<small class="muted">آخر وحدة: ' + esc(greg(c.lastDate)) + "</small>" : "") + "</div>";
    }).join("");
    var games = Object.keys(learn.games || {}).map(function (k) {
      var g = learn.games[k], parts = k.split(":"), c = COURSES[parts[0]];
      return '<div class="adm-lrow"><span class="grow"><b>' + esc(ADM_GAME_LBL[parts[1]] || parts[1]) + '</b> <small class="muted">' + esc(c ? c.title : parts[0]) + '</small></span><span class="muted" style="font-size:12px">' + g.plays + " مرة · مستوى " + ((g.lvl || 0) + 1) + '</span><b class="num">🏆 ' + g.best + "</b></div>";
    }).join("");
    var it = learn.intro || {}, scenes = it.sc || {};
    var intro = it.pts || Object.keys(scenes).length || (it.p && it.p.name)
      ? '<div class="adm-kpis k4">' + admKpi("نقاط الثقة", it.pts || 0) + admKpi("أيام كلام", Object.keys(it.days || {}).length) +
        admKpi("مواقف خلّصها", Object.keys(scenes).length) + admKpi("تقديم شخصي", it.p && it.p.name ? "✓" : "—") + "</div>" +
        (Object.keys(scenes).length ? '<div class="adm-chips">' + Object.keys(scenes).map(function (k) { return '<span class="chip">' + esc((typeof SCENES !== "undefined" && (SCENES.filter(function (x) { return x.k === k; })[0] || {}).t) || k) + " " + "★".repeat(scenes[k].stars || 0) + "</span>"; }).join("") + "</div>" : "")
      : '<p class="muted">لسه مدخلش قسم «قدّم نفسك».</p>';
    return admSeg("filter", ADM_FILTERS, f.id) +
      '<div class="adm-kpis">' + admKpi("المستوى", admLevel(learn.xp), "", (learn.xp || 0) + " نقطة") +
        admKpi("دقايق (7 أيام)", admWeekMinutes(learn, now)) + admKpi("أيام تحقيق الهدف", admGoalDaysHit(st.acc, learn, now) + "/7") +
        admKpi("متوسط الاختبارات", avg == null ? "—" : avg + "%") + admKpi("نقاط ضعف مفتوحة", Object.keys(learn.weak || {}).length) +
        admKpi("الإنجازات", Object.keys(learn.badges || {}).filter(function (b) { return learn.badges[b]; }).length) + "</div>" +
      '<div class="adm-grid2"><div class="card"><div class="adm-card-h"><h3>تقدّم الكورسات</h3></div>' + (courses || '<p class="muted">—</p>') + "</div>" +
      '<div><div class="card"><div class="adm-card-h"><h3>🎮 الألعاب</h3></div>' + (games || '<p class="muted">لسه ملعبش.</p>') + "</div>" +
      '<div class="card"><div class="adm-card-h"><h3>🎤 قدّم نفسك</h3></div>' + intro + "</div></div></div>";
  }
  function admPermBody(st) {
    var acc = st.acc, allowedC = admAllowedCourses(acc), allowedS = admAllowedSections(acc);
    var courseChips = COURSE_ORDER.map(function (cid) {
      var c = COURSES[cid]; if (!c) return "";
      return '<button class="chipbtn' + (allowedC.indexOf(cid) >= 0 ? " on" : "") + '" data-adm="pcourse" data-permcourse="' + cid + '">' + esc(c.title) + "</button>";
    }).join("");
    var sections = TOGGLEABLE_SECTIONS.map(function (s) {
      var on = allowedS.indexOf(s) >= 0;
      return '<div class="adm-switch-row"><span>' + esc(ADM_SECTION_LABEL[s]) + '</span><button class="adm-switch' + (on ? " on" : "") + '" data-adm="psection" data-permsection="' + s + '" role="switch" aria-checked="' + on + '" aria-label="' + esc(ADM_SECTION_LABEL[s]) + '"><i></i></button></div>';
    }).join("");
    return '<div class="adm-grid2"><div class="card" id="permCourseBox"><div class="adm-card-h"><h3>الكورسات المسموحة</h3><span class="row" style="gap:6px"><button class="btn sm alt" data-adm="pall">الكل</button><button class="btn sm alt" data-adm="pnone">ولا حاجة</button></span></div>' +
      '<div class="adm-chips">' + courseChips + "</div></div>" +
      '<div class="card"><div class="adm-card-h"><h3>الأقسام</h3></div>' + sections + "</div></div>" +
      '<div class="adm-save"><button class="btn" data-adm="psave" data-uid="' + esc(acc.uid) + '">حفظ الصلاحيات</button><span class="muted" id="permmsg"></span></div>' +
      '<div class="card"><div class="adm-card-h"><h3>هدف التعلّم اليومي</h3></div><div class="row wrapr" style="gap:14px">' +
      '<label class="field" style="max-width:180px">الهدف اليومي (دقيقة)<input class="inp" type="number" min="0" id="goalMin" value="' + (acc.dailyGoalMin || "") + '" placeholder="بدون هدف"></label>' +
      '<label class="field" style="max-width:180px">حد الكلمات الجديدة/يوم<input class="inp" type="number" min="0" id="goalWords" value="' + (acc.dailyNewWordLimit || "") + '" placeholder="الافتراضي"></label></div>' +
      '<div class="adm-save"><button class="btn sm" data-adm="gsave" data-uid="' + esc(acc.uid) + '">حفظ الهدف</button><span class="muted" id="goalsmsg"></span></div></div>';
  }
  function admSecurity(st) {
    var acc = st.acc, disabled = acc.active === false;
    return '<div class="adm-grid2"><div class="card"><div class="adm-card-h"><h3>🔑 رمز الدخول</h3></div><p class="muted" style="font-size:13px">الرمز الجديد بيشتغل فورًا. ابعته لصاحب الحساب بطريقة آمنة.</p>' +
      '<form class="row wrapr" data-act="admin-pw" data-uid="' + esc(acc.uid) + '" style="gap:8px;margin-block-start:10px">' +
      '<input class="inp" type="text" inputmode="numeric" placeholder="رمز جديد (4–8 أرقام)" style="max-width:190px" required pattern="\\d{4,8}" autocomplete="off">' +
      '<button class="btn sm" type="submit">تغيير الرمز</button><span class="muted pwmsg" style="font-size:12.5px"></span></form></div>' +
      '<div class="card"><div class="adm-card-h"><h3>🔔 رسالة مخصوصة</h3></div><textarea class="inp" id="admOneMsg" rows="3" placeholder="اكتب رسالة توصل له كإشعار…" style="width:100%"></textarea>' +
      '<div class="adm-save"><button class="btn sm" data-adm="sendone" data-uid="' + esc(acc.uid) + '">ابعت</button></div></div></div>' +
      '<div class="card adm-danger"><div class="adm-card-h"><h3>حالة الحساب</h3>' + admPill(disabled ? { k: "off", t: "معطّل" } : { k: "on", t: "مفعّل" }) + "</div>" +
      '<p class="muted" style="font-size:13px">' + (disabled ? "الحساب مش هيقدر يدخل لحد ما تفعّله تاني. بياناته محفوظة." : "التعطيل بيمنع الدخول بس، ومفيش أي بيانات بتتمسح.") + "</p>" +
      (disabled ? '<button class="btn sm" data-adm="activate" data-uid="' + esc(acc.uid) + '" style="margin-block-start:10px">تفعيل الحساب</button>'
        : '<p class="muted" style="font-size:12.5px;margin-block:10px 6px">للتأكيد اكتب اسم الحساب بالظبط: <b>' + esc(acc.label) + "</b></p>" +
          '<div class="row" style="gap:8px"><input class="inp" type="text" id="deactivateInput" data-expect="' + esc(acc.label) + '" style="max-width:220px" autocomplete="off"><button class="btn sm adm-btn-danger" id="deactivateConfirmBtn" data-adm="deactivate" data-uid="' + esc(acc.uid) + '" disabled>تعطيل</button></div>' +
          '<div class="muted togglemsg" style="font-size:12.5px;margin-block-start:6px"></div>') + "</div>";
  }

  function admCompare(now) {
    var html = admCompareHTML(ADM.stats, now);
    return admHead("مقارنة", "قارن الحسابات المفعّلة جنب بعض") + html;
  }

  function admNotifyTargets(now) {
    var en = admEnabled();
    if (ADM.nTo === "all") return en;
    if (ADM.nTo === "pick") return en.filter(function (st) { return ADM.nPick[st.acc.uid]; });
    return en.filter(function (st) { return admStatus(st, now).k === "cold"; });
  }
  function admNotifyMsg() { return ADM.nTpl === -1 ? ADM.nCustom.trim() : ADM_TPL[ADM.nTpl]; }
  function admNotify(now) {
    var targets = admNotifyTargets(now), en = admEnabled();
    return admHead("الإشعارات", "ابعت إشعار على موبايلات الحسابات اللي مفعّلة التذكير") +
      '<div class="adm-grid2"><div class="card"><div class="adm-card-h"><h3>1. الرسالة</h3></div><div class="adm-tpls">' +
      ADM_TPL.map(function (t, i) { return '<button class="adm-tpl' + (ADM.nTpl === i ? " on" : "") + '" data-adm="ntpl" data-v="' + i + '">' + esc(t) + "</button>"; }).join("") +
      '<button class="adm-tpl' + (ADM.nTpl === -1 ? " on" : "") + '" data-adm="ntpl" data-v="-1">✍️ رسالة من عندي</button></div>' +
      (ADM.nTpl === -1 ? '<textarea class="inp" id="admNCustom" rows="3" style="width:100%;margin-block-start:8px" placeholder="اكتب رسالتك…">' + esc(ADM.nCustom) + "</textarea>" : "") + "</div>" +
      '<div class="card"><div class="adm-card-h"><h3>2. مين يستلم</h3></div>' +
      admSeg("nto", [{ id: "follow", label: "محتاج متابعة" }, { id: "all", label: "الكل" }, { id: "pick", label: "اختار" }], ADM.nTo) +
      (ADM.nTo === "pick" ? '<div class="adm-chips" style="margin-block-start:10px">' + en.map(function (st) {
        return '<button class="chipbtn' + (ADM.nPick[st.acc.uid] ? " on" : "") + '" data-adm="npick" data-uid="' + esc(st.acc.uid) + '">' + esc(st.acc.label) + "</button>";
      }).join("") + "</div>" : '<p class="muted" style="font-size:13px;margin-block-start:10px">' + (targets.length ? targets.map(function (s) { return esc(s.acc.label); }).join("، ") : "مفيش حد في المجموعة دي دلوقتي.") + "</p>") +
      '<div class="adm-save"><button class="btn" data-adm="nsend"' + (!targets.length || ADM.sending ? " disabled" : "") + ">" + (ADM.sending ? "جارٍ الإرسال…" : "📤 ابعت لـ " + targets.length + (targets.length === 1 ? " حساب" : " حسابات")) + '</button><span class="muted" id="nmsg"></span></div></div></div>' +
      '<p class="muted" style="font-size:12.5px">الإشعار بيوصل بس للأجهزة اللي صاحبها فعّل «🔔 تذكير يومي» من الإعدادات.</p>';
  }

  function admRowsForReport(now) {
    return ADM.stats.map(function (st) {
      var w7 = admWin(st, now, 0, 7), w30 = admWin(st, now, 0, 30), last = admLastAny(st);
      var units = Object.keys(st.learn.units || {}).filter(function (k) { return st.learn.units[k].done; }).length;
      return {
        label: st.acc.label, status: admStatus(st, now).t, last: last || "—", streak: admStreak(st.days, now),
        p7: Math.round(w7.pray / 35 * 100), p30: Math.round(w30.pray / 150 * 100), pages30: w30.pages, xp30: w30.xp,
        mins7: w7.mins, units: units, weak: Object.keys(st.learn.weak || {}).length, level: admLevel(st.learn.xp)
      };
    });
  }
  var ADM_REPORT_COLS = [["label", "الحساب"], ["status", "الحالة"], ["last", "آخر نشاط"], ["streak", "سلسلة"], ["p7", "صلاة 7 أيام %"], ["p30", "صلاة 30 يوم %"], ["pages30", "صفحات 30 يوم"], ["xp30", "نقاط 30 يوم"], ["mins7", "دقايق 7 أيام"], ["units", "وحدات"], ["weak", "نقاط ضعف"], ["level", "المستوى"]];
  function admReports(now) {
    var rows = admRowsForReport(now);
    return admHead("التقارير", "ملخص شامل لكل الحسابات تقدر تنزّله") +
      '<div class="adm-grid2"><div class="card"><div class="adm-card-h"><h3>📊 ملخص Excel</h3></div><p class="muted" style="font-size:13px">ملف CSV يفتح على Excel أو Google Sheets، فيه كل المؤشرات اللي تحت.</p><div class="adm-save"><button class="btn sm" data-adm="csv">⬇️ تنزيل CSV</button></div></div>' +
      '<div class="card"><div class="adm-card-h"><h3>💾 نسخة احتياطية</h3></div><p class="muted" style="font-size:13px">كل بيانات الحسابات الخام (JSON)، احتفظ بيها في مكان آمن.</p><div class="adm-save"><button class="btn sm alt" data-adm="json">⬇️ تنزيل JSON</button></div></div></div>' +
      '<div class="card"><div class="adm-table-wrap"><table class="adm-table"><thead><tr>' + ADM_REPORT_COLS.map(function (c) { return "<th>" + esc(c[1]) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + ADM_REPORT_COLS.map(function (c) { return "<td>" + esc(String(r[c[0]])) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></div>";
  }
  function admDownload(name, text, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000);
  }
  function admCsv(now) {
    var rows = admRowsForReport(now), q = function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [ADM_REPORT_COLS.map(function (c) { return q(c[1]); }).join(",")].concat(rows.map(function (r) { return ADM_REPORT_COLS.map(function (c) { return q(r[c[0]]); }).join(","); }));
    admDownload("masar-report-" + now.key + ".csv", "﻿" + lines.join("\n"), "text/csv;charset=utf-8");
  }

  function adminAddAccountCard() {
    return '<div class="card"><div class="adm-card-h"><h3>إضافة حساب جديد</h3></div>' +
      '<form class="row wrapr" data-act="admin-create" style="gap:8px;align-items:center">' +
      '<input class="inp" type="text" name="label" placeholder="اسم الحساب" style="max-width:200px" required>' +
      '<input class="inp" type="text" name="pin" inputmode="numeric" placeholder="رمز (4–8 أرقام)" style="max-width:170px" required pattern="\\d{4,8}" autocomplete="off">' +
      '<button class="btn sm" type="submit">إضافة</button><span class="muted createmsg" style="font-size:12.5px"></span></form></div>';
  }

  var admIdleTimer = null;
  function admResetIdleTimer() {
    clearTimeout(admIdleTimer);
    admIdleTimer = setTimeout(function () {
      var a = document.getElementById("admin");
      if (a) { try { store.sb.auth.signOut(); } catch (e) { } store.uid = null; a.remove(); showLock("اتقفلت اللوحة تلقائيًا بعد عدم الاستخدام."); }
    }, 10 * 60 * 1000);
  }
  function admLock() {
    clearTimeout(admIdleTimer);
    try { store.sb.auth.signOut(); } catch (e) { }
    store.uid = null;
    var a = document.getElementById("admin"); if (a) a.remove();
    showLock("");
  }
  function admAgo() {
    if (!ADM.at) return "";
    var m = Math.round((Date.now() - ADM.at) / 60000);
    return m < 1 ? "اتحدّثت دلوقتي" : "آخر تحديث من " + m + " د";
  }
  function renderAdminDashboard(stats, keepScroll) {
    if (stats) ADM.stats = stats;
    var old = document.getElementById("admin"), scroll = keepScroll && old ? old.scrollTop : 0;
    if (old) old.remove();
    var wrap = document.createElement("div");
    wrap.id = "admin"; wrap.dir = "rtl"; wrap.lang = "ar";
    var now = nowR();
    var tab = state.adminTab || "overview";
    if (tab === "details") { tab = "profile"; ADM.sub = "activity"; } else if (tab === "perm") { tab = "profile"; ADM.sub = "perm"; }
    state.adminTab = tab;
    var body = tab === "accounts" ? admAccounts(now) : tab === "profile" ? admProfile(now) : tab === "compare" ? admCompare(now)
      : tab === "notify" ? admNotify(now) : tab === "reports" ? admReports(now) : admOverview(now);
    var nav = ADM_NAV.map(function (n) {
      return '<button data-adm="nav" data-v="' + n.id + '"' + (n.id === tab ? ' aria-current="page"' : "") + ">" + admIco(n.id) + "<span>" + esc(n.label) + "</span></button>";
    }).join("");
    wrap.innerHTML = '<div class="adm-shell"><aside class="adm-side"><div class="adm-brand"><span class="adm-logo">م</span><div><b>مسار</b><small>لوحة التحكم</small></div></div>' +
      '<nav class="adm-nav" aria-label="أقسام اللوحة">' + nav + "</nav>" +
      '<div class="adm-side-foot"><small class="muted">' + esc(admAgo()) + '</small><div class="row" style="gap:6px"><button class="btn sm alt" data-adm="refresh">↻ تحديث</button><button class="btn sm alt" data-adm="lock">🔒 قفل</button></div></div></aside>' +
      '<main class="adm-main">' + body + "</main></div>";
    document.body.appendChild(wrap);
    wrap.scrollTop = scroll;
    wrap.addEventListener("click", admOnClick);
    wrap.addEventListener("input", admOnInput);
    wrap.addEventListener("change", admOnChange);
    wrap.addEventListener("submit", function (e) {
      var f = e.target; e.preventDefault();
      if (f.getAttribute("data-act") === "admin-pw") adminChangePassword(f);
      if (f.getAttribute("data-act") === "admin-create") adminCreateAccount(f);
    });
    wrap.addEventListener("keydown", admResetIdleTimer);
    admResetIdleTimer();
  }
  function admRerender() { renderAdminDashboard(null, true); }
  async function admRemind(uid, msg, btn) {
    var prev = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    var r = await adminSendReminder(uid, msg || ADM_TPL[0]);
    if (btn) { btn.disabled = false; btn.textContent = prev; }
    toast(r.error ? "تعذّر الإرسال: " + r.error : "تم إرسال التذكير ✓");
    return r;
  }
  async function admOnClick(e) {
    admResetIdleTimer();
    var el = e.target.closest("[data-adm]"); if (!el || el.disabled) return;
    var a = el.getAttribute("data-adm"), v = el.getAttribute("data-v"), uid = el.getAttribute("data-uid"), now = nowR();
    switch (a) {
      case "nav": state.adminTab = v; renderAdminDashboard(); break;
      case "open": state.adminDetailUid = uid; state.adminTab = "profile"; ADM.sub = el.getAttribute("data-sub") || "activity"; renderAdminDashboard(); break;
      case "sub": ADM.sub = v; admRerender(); break;
      case "range": ADM.range = Number(v); admRerender(); break;
      case "metric": ADM.metric = v; admRerender(); break;
      case "filter": state.adminFilter = v; admRerender(); break;
      case "lfilter": ADM.lfilter = v; admRerender(); break;
      case "addtoggle": ADM.addOpen = !ADM.addOpen; admRerender(); break;
      case "refresh": el.disabled = true; el.textContent = "…"; await loadAdminDashboard(); break;
      case "lock": admLock(); break;
      case "remind": admRemind(uid, null, el); break;
      case "pcourse": el.classList.toggle("on"); break;
      case "pall": document.querySelectorAll("#admin [data-permcourse]").forEach(function (c) { c.classList.add("on"); }); break;
      case "pnone": document.querySelectorAll("#admin [data-permcourse]").forEach(function (c) { c.classList.remove("on"); }); break;
      case "psection": var on = el.classList.toggle("on"); el.setAttribute("aria-checked", String(on)); break;
      case "psave": {
        var chips = Array.from(document.querySelectorAll("#admin [data-permcourse]")), secs = Array.from(document.querySelectorAll("#admin [data-permsection]"));
        var isOn = function (x) { return x.classList.contains("on"); };
        var courses = chips.every(isOn) ? null : chips.filter(isOn).map(function (c) { return c.getAttribute("data-permcourse"); });
        var sections = secs.every(isOn) ? null : secs.filter(isOn).map(function (b) { return b.getAttribute("data-permsection"); });
        var pm = document.getElementById("permmsg"); pm.textContent = "جارٍ الحفظ…"; el.disabled = true;
        var r = await adminSetPermissions(uid, courses, sections); el.disabled = false;
        if (r.error) { pm.textContent = "تعذّر الحفظ: " + r.error + (/unknown action|not found|404/i.test(r.error) ? " — محتاج تحدّث الـ Edge Function الأول." : ""); break; }
        pm.textContent = "تم الحفظ ✓"; await loadAccountsList(); admSyncAccounts(); break;
      }
      case "gsave": {
        var gm = parseInt(document.getElementById("goalMin").value, 10) || 0, gw = parseInt(document.getElementById("goalWords").value, 10) || 0;
        var msg = document.getElementById("goalsmsg"); msg.textContent = "جارٍ الحفظ…"; el.disabled = true;
        var r2 = await adminSetGoals(uid, gm, gw); el.disabled = false;
        if (r2.error) { msg.textContent = "تعذّر الحفظ: " + r2.error + (/unknown action|not found|404/i.test(r2.error) ? " — محتاج تحدّث الـ Edge Function الأول." : ""); break; }
        msg.textContent = "تم الحفظ ✓"; await loadAccountsList(); admSyncAccounts(); break;
      }
      case "sendone": {
        var t = (document.getElementById("admOneMsg").value || "").trim();
        if (!t) { toast("اكتب الرسالة الأول."); break; }
        var r3 = await admRemind(uid, t, el); if (!r3.error) document.getElementById("admOneMsg").value = ""; break;
      }
      case "activate": el.disabled = true; await adminToggleActive(uid, true); break;
      case "deactivate": {
        el.disabled = true; el.textContent = "جارٍ التنفيذ…";
        var r4 = await adminToggleActive(uid, false), tm = document.querySelector("#admin .togglemsg");
        if (r4 && r4.error && tm) { tm.textContent = "تعذّر: " + r4.error; el.disabled = false; el.textContent = "تعطيل"; }
        break;
      }
      case "ntpl": ADM.nTpl = Number(v); admRerender(); break;
      case "nto": ADM.nTo = v; admRerender(); break;
      case "npick": ADM.nPick[uid] = !ADM.nPick[uid]; admRerender(); break;
      case "nsend": {
        var text = admNotifyMsg(), targets = admNotifyTargets(now);
        if (!text) { toast("اكتب الرسالة الأول."); break; }
        if (!confirm("هيتبعت الإشعار لـ " + targets.length + " حساب. متأكد؟")) break;
        ADM.sending = true; admRerender();
        var ok = 0, fail = 0;
        for (var i = 0; i < targets.length; i++) { var rr = await adminSendReminder(targets[i].acc.uid, text); if (rr.error) fail++; else ok++; }
        ADM.sending = false; admRerender();
        toast("اتبعت لـ " + ok + " من " + targets.length + (fail ? " · فشل " + fail : " ✓")); break;
      }
      case "csv": admCsv(now); break;
      case "json": admDownload("masar-admin-backup-" + now.key + ".json", JSON.stringify({ at: new Date().toISOString(), accounts: ADM.stats.map(function (s) { return s.acc; }), data: ADM.raw }), "application/json"); break;
    }
  }
  function admOnInput(e) {
    var t = e.target;
    if (t.id === "admQ") { ADM.q = t.value; var l = document.getElementById("admList"); if (l) l.innerHTML = admAccountsList(nowR()); }
    if (t.id === "admNCustom") ADM.nCustom = t.value;
    if (t.id === "deactivateInput") { var b = document.getElementById("deactivateConfirmBtn"); if (b) b.disabled = t.value.trim() !== t.getAttribute("data-expect"); }
  }
  function admOnChange(e) {
    var t = e.target;
    if (t.id === "admSort") { ADM.sort = t.value; var l = document.getElementById("admList"); if (l) l.innerHTML = admAccountsList(nowR()); }
    if (t.id === "admSwitch") { state.adminDetailUid = t.value; admRerender(); }
  }
  // After permissions/goals change, refresh each stats row's acc from ACCOUNTS so
  // the dashboard reflects what was just saved without a full data refetch.
  function admSyncAccounts() {
    ADM.stats.forEach(function (st) { var a = ACCOUNTS.filter(function (x) { return x.uid === st.acc.uid; })[0]; if (a) st.acc = a; });
    admRerender();
  }
  async function loadAdminDashboard() {
    if (!store.uid) return;
    // Reading other accounts' masar_days/masar_meta rows directly (with the
    // anon key) depends on an RLS policy letting the admin cross-read, which
    // turned out to be fragile in practice — so instead this goes through the
    // same secured Edge Function used for every other admin write, which
    // reads with the service-role key and so always sees every row.
    var r = await adminFnCall({ action: "getDashboardData" });
    if (r.error) {
      toast("تعذّر تحميل بيانات اللوحة: " + r.error);
      return;
    }
    ADM.raw = r.data; ADM.at = Date.now();
    var dRows = r.data.days || [], mRows = r.data.meta || [];
    var accounts = ACCOUNTS.filter(function (a) { return a.role === "user"; });
    var stats = accounts.map(function (acc) {
      var days = {};
      dRows.forEach(function (row) { if (row.user_id === acc.uid) days[row.day] = row.data || {}; });
      var learn = { xp: 0, units: {}, cards: {}, study: {} };
      mRows.forEach(function (row) { if (row.user_id === acc.uid && row.name === "learn") learn = Object.assign({ xp: 0, units: {}, cards: {}, study: {} }, row.data || {}); });
      return { acc: acc, days: days, learn: learn };
    });
    if (!state.adminDetailUid && stats.length) state.adminDetailUid = stats[0].acc.uid;
    renderAdminDashboard(stats, true);
  }
  function admCompareHTML(stats, now) {
    var activeStats = stats.filter(function (st) { return st.acc.active !== false; });
    if (activeStats.length < 2) return '<div class="card muted" style="text-align:center;padding:24px">محتاج حسابين مفعّلين على الأقل للمقارنة.</div>';
    var f = admFilterDef();
    var filterSeg = '<div class="seg2" style="margin-block:6px 12px">' + ADM_FILTERS.map(function (fd) {
      return '<button data-adm="filter" data-v="' + fd.id + '" aria-pressed="' + (fd.id === f.id) + '">' + esc(fd.label) + "</button>";
    }).join("") + "</div>";
    var withP = activeStats.map(function (st) { return { acc: st.acc, days: st.days, p: admPeriodStats(st.acc, st.days, st.learn, now, f) }; });
    var shared = COURSE_ORDER.filter(function (cid) { return withP.every(function (w) { return admAllowedCourses(w.acc).indexOf(cid) >= 0; }); });
    var legend = '<div class="row wrapr" style="gap:16px;margin-block-end:10px;font-size:12.5px">' +
      withP.map(function (w, i) { return '<span class="row" style="gap:6px;align-items:center"><span style="width:10px;height:10px;border-radius:3px;display:inline-block;background:' + accColor(i) + '"></span>' + esc(w.acc.label) + "</span>"; }).join("") + "</div>";
    function barsFor(label, valFn, fmtFn) {
      var vals = withP.map(valFn), max = Math.max.apply(null, vals.concat([1]));
      var bars = withP.map(function (w, i) {
        var v = valFn(w), width = Math.max(2, Math.round(v / max * 100));
        return '<div class="row" style="align-items:center;gap:6px;margin-block-start:' + (i === 0 ? "0" : "3") + 'px"><div style="flex:1;height:9px;border-radius:4px;background:var(--surface2);overflow:hidden"><div style="width:' + width + '%;height:100%;border-radius:4px;background:' + accColor(i) + '"></div></div><span class="num" style="min-width:46px;text-align:end;font-size:12.5px">' + esc(fmtFn(w)) + "</span></div>";
      }).join("");
      return '<div style="margin-block-end:10px"><div class="muted" style="font-size:12.5px;margin-block-end:3px">' + esc(label) + "</div>" + bars + "</div>";
    }
    var generalRows = barsFor("صلوات", function (w) { return w.p.prayDone; }, function (w) { return w.p.prayDone + "/" + w.p.prayTotal; }) +
      barsFor("صفحات قرآن", function (w) { return w.p.pages; }, function (w) { return String(w.p.pages); }) +
      barsFor("XP فترة المقارنة", function (w) { return w.p.xp; }, function (w) { return String(w.p.xp); });
    var courseRows = shared.length ? shared.map(function (cid) {
      var c = COURSES[cid]; if (!c) return "";
      return barsFor(c.title, function (w) { var pc = w.p.courses.filter(function (x) { return x.cid === cid; })[0]; return pc ? pc.done : 0; }, function (w) { var pc = w.p.courses.filter(function (x) { return x.cid === cid; })[0]; return pc ? pc.done + "/" + pc.total : "0"; });
    }).join("") : '<p class="muted" style="font-size:13px">مفيش كورسات مشتركة بين الحسابات دي.</p>';
    var donut = donutChartSVG(withP.map(function (w, i) { return { acc: w.acc, s: { totalPages: w.p.pages } }; }), function (x) { return x.s.totalPages; });
    return filterSeg +
      '<div class="card"><h3 style="margin:0 0 10px">مقارنة عامة</h3>' + legend + generalRows + "</div>" +
      '<div class="card"><h3 style="margin:0 0 10px">مقارنة الكورسات المشتركة</h3>' + legend + courseRows + "</div>" +
      '<div class="card"><h3 style="margin:0 0 10px">توزيع صفحات القرآن</h3>' + legend + donut + "</div>";
  }
  function donutChartSVG(stats, valueFn) {
    var vals = stats.map(valueFn);
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var size = 180, cx = size / 2, cy = size / 2, r = 70, sw = 26;
    var circ = 2 * Math.PI * r;
    var segs = "";
    if (total <= 0) {
      segs = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--surface2)" stroke-width="' + sw + '"/>';
    } else {
      var offset = 0;
      for (var i = 0; i < stats.length; i++) {
        var frac = vals[i] / total;
        if (frac <= 0) continue;
        var len = frac * circ;
        segs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + accColor(i) + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(1) + " " + (circ - len).toFixed(1) + '" stroke-dashoffset="' + (-offset).toFixed(1) + '" transform="rotate(-90 ' + cx + " " + cy + ')"><title>' + esc(stats[i].acc.label) + ": " + vals[i] + "</title></circle>";
        offset += len;
      }
    }
    var centerLabel = total > 0 ? String(total) : "0";
    return '<svg viewBox="0 0 ' + size + " " + size + '" style="width:180px;height:180px;display:block;margin-inline:auto" role="img" aria-label="توزيع صفحات القرآن بين الحسابات">' +
      segs +
      '<text x="' + cx + '" y="' + (cy - 3) + '" text-anchor="middle" font-size="22" font-weight="700" style="fill:var(--text)">' + centerLabel + "</text>" +
      '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="10.5" style="fill:var(--muted)">إجمالي الصفحات</text>' +
      "</svg>";
  }
  async function loadSupa(first) {
    if (!store.uid) return;
    var before = snap();
    var d = await store.sb.from("masar_days").select("day,data");
    var m = await store.sb.from("masar_meta").select("name,data");
    if (d.error || m.error) {
      var err = (d.error || m.error).message || "";
      toast("تعذّر تحميل البيانات: " + err);
      if (first) { ready.days = ready.settings = ready.learn = ready.exp = true; checkLoaded(); render(); }
      return;
    }
    (d.data || []).forEach(function (r) { if (!dirty["day:" + r.day]) state.days[r.day] = r.data || {}; });
    var hasSettings = false;
    (m.data || []).forEach(function (r) {
      if (r.name === "settings") { hasSettings = true; if (!dirty["meta:settings"]) Object.assign(state.settings, r.data); }
      if (r.name === "learn" && !dirty["meta:learn"]) state.learn = Object.assign(freshLearn(), r.data);
      if (r.name === "exp" && !dirty["meta:exp"]) {
        var ed = r.data || {};
        // Merge field-by-field rather than a flat Object.assign: an older save (from
        // before "budgets"/"recurring" existed, or any stored null) must fall back to
        // a safe default per-field, otherwise a null/missing value here crashes every
        // render() downstream in money.js (anything reading .length / .budgets[...]).
        state.exp = {
          categories: Array.isArray(ed.categories) ? ed.categories : [],
          items: Array.isArray(ed.items) ? ed.items : [],
          salary: (ed.salary && typeof ed.salary === "object") ? ed.salary : {},
          budgets: (ed.budgets && typeof ed.budgets === "object") ? ed.budgets : {},
          recurring: Array.isArray(ed.recurring) ? ed.recurring : [],
          goals: Array.isArray(ed.goals) ? ed.goals : [],
          zakat: (ed.zakat && typeof ed.zakat === "object") ? ed.zakat : {}
        };
      }
    });
    if (!hasSettings && first) { state.settings.startDate = nowR().key; saveMeta("settings"); }
    ensureNotesSeed();
    if (first) migrateSrsV2(nowR()); // fire-and-forget, once per sign-in is plenty — it's itself idempotent
    ready.days = ready.settings = ready.learn = ready.exp = true;
    var wasLoaded = state.loaded; checkLoaded();
    if (wasLoaded && snap() !== before) render();
  }
  async function lockNow() {
    clearInterval(store.poll);
    try { await store.sb.auth.signOut(); } catch (e) { }
    store.uid = null; state.days = {}; state.learn = freshLearn();
    state.settings = { startDate: nowR().key, unit: "page", amount: 5, startPage: 1, certName: "" };
    state.exp = { categories: [], items: [], salary: {}, budgets: {}, recurring: [], goals: [], zakat: {} }; state.expMonth = null; state.expTab = "main"; state.expQ = ""; state.expAdd = false; state.expCat = ""; state.expNewCat = false; state.expSalEdit = false;
    state.loaded = false; ready.days = ready.settings = ready.learn = ready.exp = false;
    state.quiz = null; state.card = null; state.spk = null; state.wd = null; state.weakTab = "all"; state.lv = { mode: "courses" }; state.tab = "home"; state.pv = "today"; state.hv = "dashboard"; state.az = null; state.azProgress = {}; state.azOpen = {}; panelCache = {};
    resetPermissions(); // clear any restriction the previous account left behind
    $("#pager").scrollTo({ left: 0 }); render(); showLock("");
  }
  $("#lockform").addEventListener("submit", function (e) { e.preventDefault(); var v = $("#pin").value.trim(); if (v) unlock(v); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && state.mode === "supa" && store.uid) loadSupa(false); });

