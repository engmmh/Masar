"use strict";
  /* ---------------- admin dashboard ---------------- */
  var ADMIN_FN_URL = CFG.url + "/functions/v1/admin-change-password";
  var ACCOUNT_COLORS = ["var(--teal)", "var(--blue)", "var(--amber)", "var(--miss)"];
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
    return (Array.isArray(acc.courses) && acc.courses.length) ? COURSE_ORDER.filter(function (c) { return acc.courses.indexOf(c) >= 0; }) : COURSE_ORDER.slice();
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
  function adminAddAccountCard() {
    return '<div class="card">' +
      '<h3 style="margin:0 0 10px">إضافة حساب جديد</h3>' +
      '<form class="row wrapr" data-act="admin-create" style="gap:8px;align-items:center">' +
      '<input class="inp" type="text" name="label" placeholder="اسم الحساب" style="max-width:180px" required>' +
      '<input class="inp" type="text" name="pin" inputmode="numeric" placeholder="رمز (4 أرقام)" style="max-width:150px" required pattern="\\d{4,8}">' +
      '<button class="btn sm" type="submit">إضافة</button>' +
      '<span class="muted createmsg" style="font-size:12.5px"></span>' +
      "</form></div>";
  }
  var ADMIN_TABS = [
    { id: "overview", label: "نظرة عامة" },
    { id: "details", label: "التفاصيل" },
    { id: "perm", label: "الصلاحيات" },
    { id: "compare", label: "مقارنة" }
  ];
  function adminTabsNav(active) {
    return '<div class="row wrapr" style="gap:8px;margin-block-end:4px">' +
      ADMIN_TABS.map(function (t) {
        return '<button class="chip' + (t.id === active ? " on" : "") + '" type="button" data-admtab="' + t.id + '">' + esc(t.label) + "</button>";
      }).join("") +
      "</div>";
  }
  function admAccountPicker(stats, into) {
    if (!stats.length) return '<div class="card muted" style="text-align:center;padding:24px">مفيش حسابات لسه.</div>';
    return '<div class="card"><h3 style="margin:0 0 10px">اختار حساب</h3><div class="row wrapr" style="gap:8px">' +
      stats.map(function (st) { return '<button class="chip" type="button" data-admopen="' + esc(st.acc.uid) + '" data-into="' + into + '">' + esc(st.acc.label) + "</button>"; }).join("") +
      "</div></div>";
  }
  function admOverviewHTML(stats, now) {
    var activeToday = 0, activeWeek = 0, followUp = [], totalMinutes = 0;
    stats.forEach(function (st) {
      totalMinutes += admWeekMinutes(st.learn, now);
      if (st.acc.active === false) return;
      if (admDayActivity(st.days, now.key) > 0) activeToday++;
      var weekAny = false;
      for (var i = 0; i < 7; i++) if (admDayActivity(st.days, addDays(now.key, -i)) > 0) { weekAny = true; break; }
      if (weekAny) activeWeek++;
      var last = admLastActiveKey(st.days), since = admDaysSince(last, now);
      if (since === null || since >= ADM_FOLLOWUP_DAYS) followUp.push({ st: st, since: since, last: last });
    });
    var kpis = '<div class="row wrapr" style="gap:18px">' +
      statTile("نشط النهارده", activeToday) + statTile("نشط الأسبوع ده", activeWeek) +
      statTile("دقايق تعلّم الأسبوع", totalMinutes) + statTile("محتاج متابعة", followUp.length) + "</div>";
    var alerts = followUp.map(function (f) {
      var since = f.since === null ? "من غير أي نشاط لسه" : "بقاله " + fmtDaysAr(f.since) + " من غير نشاط";
      return '<div class="card alert"><div class="row between" style="align-items:center;gap:8px">' +
        '<span>' + esc(f.st.acc.label) + " " + since + (f.last ? " · آخر نشاط " + greg(f.last) : "") + '</span>' +
        '<span class="row" style="gap:6px;flex:none"><button class="btn sm alt" type="button" data-admremind="' + esc(f.st.acc.uid) + '">🔔 ابعت تذكير</button><button class="btn sm" data-admopen="' + esc(f.st.acc.uid) + '" data-into="details">شوف</button></span>' +
        "</div></div>";
    }).join("");
    var rows = stats.map(function (st, i) {
      var disabled = st.acc.active === false;
      var color = accColor(i), s = admStreak(st.days, now), last = admLastActiveKey(st.days), since = admDaysSince(last, now);
      var statusTag = disabled ? '<span class="chip" style="color:var(--muted)">معطّل</span>'
        : (admDayActivity(st.days, now.key) > 0 ? '<span class="chip" style="background:var(--ok-soft,var(--surface2));color:var(--teal)">نشط النهارده</span>'
          : (since === null ? '<span class="chip" style="color:var(--amber-deep)">من غير نشاط</span>' : '<span class="chip" style="color:var(--amber-deep)">غايب ' + fmtDaysAr(since) + "</span>"));
      // "سؤال من الأخطاء" stands in for Phase 8's not-yet-built "نقطة ضعف مفتوحة" model —
      // same underlying mistake-bank data, honest label until that dedicated feature exists.
      var learnLine = "الهدف اتحقق " + admGoalDaysHit(st.acc, st.learn, now) + "/7 أيام · " + admMistakeCount(st.learn) + " سؤال من الأخطاء";
      return '<button class="card" type="button" style="text-align:start;display:block;width:100%" data-admopen="' + esc(st.acc.uid) + '" data-into="details">' +
        '<div class="row between" style="align-items:center;gap:10px">' +
        '<div class="row" style="align-items:center;gap:10px">' +
        '<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;background:' + color + '">' + esc(initialsOf(st.acc.label)) + "</div>" +
        '<div><h3 style="margin:0;font-size:15px">' + esc(st.acc.label) + '</h3><span class="muted" style="font-size:12px">' + (s ? "سلسلة " + fmtDaysAr(s) : "لا توجد سلسلة حالية") + "</span></div></div>" +
        statusTag + "</div><div class=\"week\" style=\"height:46px;margin-block-start:8px\">" + admWeekBars(st.days, now).replace(/<b class="num"[^<]*<\/b>/g, "") + "</div>" +
        '<p class="muted" style="font-size:12px;margin-block-start:8px">' + esc(learnLine) + "</p></button>";
    }).join("");
    return kpis + alerts + '<div class="sec-h">الحسابات</div>' + rows;
  }
  function admDetailsHTML(stats, now) {
    var st = stats.filter(function (s) { return s.acc.uid === state.adminDetailUid; })[0];
    if (!st) return admAccountPicker(stats, "details");
    var f = admFilterDef(), p = admPeriodStats(st.acc, st.days, st.learn, now, f);
    var filterSeg = '<div class="seg2" style="margin-block:6px 12px">' + ADM_FILTERS.map(function (fd) {
      return '<button data-admfilter="' + fd.id + '" aria-pressed="' + (fd.id === f.id) + '">' + esc(fd.label) + "</button>";
    }).join("") + "</div>";
    var kpis = '<div class="row wrapr" style="gap:18px">' +
      statTile("صلوات", p.prayDone + "/" + p.prayTotal) + statTile("صفحات قرآن", p.pages) + statTile("XP", "+" + p.xp) + "</div>";
    var avgQuiz = admAvgQuizScore(st.learn);
    var learnKpis = '<div class="row wrapr" style="gap:18px">' +
      statTile("دقايق التعلّم (7 أيام)", admWeekMinutes(st.learn, now)) +
      statTile("أيام تحقيق الهدف", admGoalDaysHit(st.acc, st.learn, now) + "/7") +
      statTile("متوسط درجات الاختبارات", avgQuiz == null ? "—" : avgQuiz + "%") + "</div>";
    var courses = p.courses.map(function (c) {
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
      var lastTxt = c.lastDate ? "آخر وحدة: " + greg(c.lastDate) : (c.done ? "" : "ماتحركش لسه");
      if (!c.allowed) {
        return '<div style="margin-block-end:10px;opacity:.5"><div class="row between" style="font-size:13px"><span>' + esc(c.title) + '</span><span class="muted">مش مسموح</span></div><div class="bar" style="margin-block-start:4px"><i style="width:0"></i></div></div>';
      }
      return '<div style="margin-block-end:10px"><div class="row between" style="font-size:13px"><span>' + esc(c.title) + "</span><span class=\"num\">" + c.done + "/" + c.total + "</span></div><div class=\"bar\" style=\"margin-block-start:4px\"><i style=\"width:" + pct + '%"></i></div>' + (lastTxt ? '<span class="muted" style="font-size:12px">' + esc(lastTxt) + "</span>" : "") + "</div>";
    }).join("");
    return '<div class="row between" style="align-items:center"><h3 style="margin:0">' + esc(st.acc.label) + '</h3><button class="chip" type="button" data-act="admin-back">رجوع</button></div>' +
      filterSeg + '<div class="card">' + kpis + "</div>" +
      '<div class="card"><h3 style="margin:0 0 10px">مؤشرات التعلّم</h3>' + learnKpis +
      '<p class="muted" style="font-size:12px;margin-block-start:10px">نقاط ضعف مفتوحة دلوقتي: <b class="num">' + Object.keys(st.learn.weak || {}).length + '</b> · أسئلة بنك الأخطاء القديم (قبل الدمج): <b class="num">' + admMistakeCount(st.learn) + "</b> · الخط الزمني التفصيلي لسه في مرحلة لاحقة.</p></div>" +
      '<div class="card"><h3 style="margin:0 0 10px">تقدّم الكورسات</h3>' + courses + "</div>";
  }
  function admPermHTML(stats, now) {
    var st = stats.filter(function (s) { return s.acc.uid === state.adminDetailUid; })[0];
    if (!st) return admAccountPicker(stats, "perm");
    var acc = st.acc, allowedC = admAllowedCourses(acc), allowedS = admAllowedSections(acc);
    var courseChips = COURSE_ORDER.map(function (cid) {
      var c = COURSES[cid]; if (!c) return "";
      var on = allowedC.indexOf(cid) >= 0;
      return '<span class="chip' + (on ? " on" : "") + '" data-permcourse="' + cid + '" role="button" tabindex="0">' + esc(c.title) + "</span>";
    }).join("");
    var sectionToggles = TOGGLEABLE_SECTIONS.map(function (s) {
      var on = allowedS.indexOf(s) >= 0;
      return '<div class="row between" style="padding-block:6px;border-block-start:1px solid var(--line)"><span>' + esc(ADM_SECTION_LABEL[s]) + '</span><button class="chip' + (on ? " on" : "") + '" type="button" data-permsection="' + s + '">' + (on ? "مفعّل" : "متوقف") + "</button></div>";
    }).join("");
    var disabled = acc.active === false;
    return '<div class="row between" style="align-items:center"><h3 style="margin:0">صلاحيات: ' + esc(acc.label) + '</h3><button class="chip" type="button" data-act="admin-back">رجوع</button></div>' +
      '<div class="card" id="permCourseBox" data-uid="' + esc(acc.uid) + '">' +
      '<h4 class="muted" style="margin:0 0 8px;font-size:13px">الكورسات اللي تظهر للحساب ده</h4>' +
      '<div class="row wrapr" style="gap:6px">' + courseChips + "</div>" +
      '<div class="row wrapr" style="gap:8px;margin-block-start:10px"><button class="chip sm" type="button" data-act="perm-all">اختار الكل</button><button class="chip sm" type="button" data-act="perm-none">شيل الكل</button></div>' +
      "</div>" +
      '<div class="card"><h4 class="muted" style="margin:0 0 4px;font-size:13px">الأقسام</h4>' + sectionToggles + "</div>" +
      '<div class="row wrapr" style="gap:8px"><button class="btn" type="button" data-act="perm-save" data-uid="' + esc(acc.uid) + '">حفظ الصلاحيات</button><span class="muted" id="permmsg" style="font-size:12.5px"></span></div>' +
      '<div class="card"><h4 class="muted" style="margin:0 0 8px;font-size:13px">هدف التعلّم اليومي</h4>' +
      '<div class="row wrapr" style="gap:14px">' +
      '<label class="field" style="max-width:160px">الهدف اليومي (دقيقة)<input class="inp" type="number" min="0" id="goalMin" value="' + (acc.dailyGoalMin || "") + '" placeholder="بدون هدف"></label>' +
      '<label class="field" style="max-width:160px">حد الكلمات الجديدة/يوم<input class="inp" type="number" min="0" id="goalWords" value="' + (acc.dailyNewWordLimit || "") + '" placeholder="الافتراضي"></label>' +
      "</div>" +
      '<div class="row wrapr" style="gap:8px;margin-block-start:10px"><button class="btn sm" type="button" data-act="goals-save" data-uid="' + esc(acc.uid) + '">حفظ الهدف</button><span class="muted" id="goalsmsg" style="font-size:12.5px"></span></div></div>' +
      '<div class="card"><h4 class="muted" style="margin:0 0 8px;font-size:13px">رمز الدخول</h4>' +
      '<form class="row" data-act="admin-pw" data-uid="' + esc(acc.uid) + '" style="gap:8px;align-items:center">' +
      '<input class="inp" type="text" inputmode="numeric" placeholder="رمز جديد (4 أرقام)" style="max-width:150px" required pattern="\\d{4,8}">' +
      '<button class="btn sm" type="submit">تغيير الرمز</button><span class="muted pwmsg" style="font-size:12.5px"></span></form></div>' +
      '<div class="card"><h4 class="muted" style="margin:0 0 8px;font-size:13px">حالة الحساب</h4>' +
      '<div class="row between" style="align-items:center"><span>' + (disabled ? "معطّل حاليًا" : "مفعّل") + '</span><button class="chip" type="button" data-act="admin-toggle" data-uid="' + esc(acc.uid) + '" data-active="' + (disabled ? "0" : "1") + '">' + (disabled ? "تفعيل" : "تعطيل") + "</button></div>" +
      '<div id="deactivateConfirm" hidden style="margin-block-start:10px;padding-block-start:10px;border-block-start:1px solid var(--line)">' +
      '<p class="muted" style="font-size:12.5px;margin:0 0 6px">للتأكيد، اكتب اسم الحساب بالظبط: <b>' + esc(acc.label) + "</b></p>" +
      '<div class="row" style="gap:8px"><input class="inp" type="text" id="deactivateInput" style="max-width:200px"><button class="btn sm" type="button" id="deactivateConfirmBtn" disabled>تأكيد التعطيل</button></div>' +
      '<div class="muted togglemsg" style="font-size:12.5px;margin-block-start:6px"></div></div></div>' +
      adminAddAccountCard();
  }
  function admCompareHTML(stats, now) {
    var activeStats = stats.filter(function (st) { return st.acc.active !== false; });
    if (activeStats.length < 2) return '<div class="card muted" style="text-align:center;padding:24px">محتاج حسابين مفعّلين على الأقل للمقارنة.</div>';
    var f = admFilterDef();
    var filterSeg = '<div class="seg2" style="margin-block:6px 12px">' + ADM_FILTERS.map(function (fd) {
      return '<button data-admfilter="' + fd.id + '" aria-pressed="' + (fd.id === f.id) + '">' + esc(fd.label) + "</button>";
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
  var admIdleTimer = null;
  function admResetIdleTimer() {
    clearTimeout(admIdleTimer);
    admIdleTimer = setTimeout(function () {
      var a = document.getElementById("admin");
      if (a) { try { store.sb.auth.signOut(); } catch (e) { } store.uid = null; a.remove(); showLock("اتقفلت اللوحة تلقائيًا بعد عدم الاستخدام."); }
    }, 10 * 60 * 1000);
  }
  function renderAdminDashboard(stats) {
    var old = document.getElementById("admin"); if (old) old.remove();
    var wrap = document.createElement("div");
    wrap.id = "admin"; wrap.dir = "rtl"; wrap.lang = "ar";
    wrap.style.cssText = "position:fixed;inset:0;z-index:200;overflow:auto;background:var(--bg);padding:16px";
    var now = nowR();
    var active = state.adminTab || "overview";
    var body = active === "overview" ? admOverviewHTML(stats, now)
      : active === "details" ? admDetailsHTML(stats, now)
        : active === "perm" ? admPermHTML(stats, now)
          : admCompareHTML(stats, now);
    wrap.innerHTML = '<div style="max-width:640px;margin-inline:auto;display:flex;flex-direction:column;gap:12px">' +
      '<div class="row between" style="align-items:center"><h1 style="margin:0">لوحة المتابعة</h1><button class="chip" id="adminlock">قفل</button></div>' +
      adminTabsNav(active) +
      '<div id="admtab-body" style="display:flex;flex-direction:column;gap:12px">' + body + "</div>" +
      "</div>";
    document.body.appendChild(wrap);
    document.getElementById("adminlock").addEventListener("click", function () {
      clearTimeout(admIdleTimer);
      try { store.sb.auth.signOut(); } catch (e) { }
      store.uid = null;
      var a = document.getElementById("admin"); if (a) a.remove();
      showLock("");
    });
    wrap.addEventListener("click", admResetIdleTimer);
    wrap.addEventListener("keydown", admResetIdleTimer);
    admResetIdleTimer();
    wrap.querySelectorAll("[data-admtab]").forEach(function (btn) {
      btn.addEventListener("click", function () { state.adminTab = btn.getAttribute("data-admtab"); renderAdminDashboard(stats); });
    });
    wrap.querySelectorAll("[data-admopen]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.adminDetailUid = btn.getAttribute("data-admopen");
        state.adminTab = btn.getAttribute("data-into") || "details";
        renderAdminDashboard(stats);
      });
    });
    wrap.querySelectorAll("[data-admfilter]").forEach(function (btn) {
      btn.addEventListener("click", function () { state.adminFilter = btn.getAttribute("data-admfilter"); renderAdminDashboard(stats); });
    });
    wrap.querySelectorAll("[data-admremind]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var uid = btn.getAttribute("data-admremind"), prevText = btn.textContent;
        btn.disabled = true; btn.textContent = "جارٍ الإرسال…";
        var r = await adminSendReminder(uid, "فاتك تذاكر النهاردة في مسار — افتح التطبيق وكمّل.");
        btn.disabled = false; btn.textContent = prevText;
        toast(r.error ? "تعذّر الإرسال: " + r.error : "تم إرسال التذكير ✓");
      });
    });
    var backBtn = wrap.querySelector('[data-act="admin-back"]');
    if (backBtn) backBtn.addEventListener("click", function () { state.adminTab = "overview"; renderAdminDashboard(stats); });
    wrap.querySelectorAll('[data-act="admin-pw"]').forEach(function (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); adminChangePassword(form); });
    });
    wrap.querySelectorAll('[data-act="admin-create"]').forEach(function (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); adminCreateAccount(form); });
    });
    // deactivate needs the admin to type the account's exact name first; reactivating is one click
    var toggleBtn = wrap.querySelector('[data-act="admin-toggle"]');
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        var uid = toggleBtn.getAttribute("data-uid"), curActive = toggleBtn.getAttribute("data-active") === "1";
        if (!curActive) { adminToggleActive(uid, true); return; }
        var box = document.getElementById("deactivateConfirm");
        if (box) box.hidden = !box.hidden;
      });
    }
    var deactInput = document.getElementById("deactivateInput"), deactBtn = document.getElementById("deactivateConfirmBtn");
    if (deactInput && deactBtn && toggleBtn) {
      var expectLabel = (stats.filter(function (s) { return s.acc.uid === state.adminDetailUid; })[0] || {}).acc;
      deactInput.addEventListener("input", function () { deactBtn.disabled = !(expectLabel && deactInput.value.trim() === expectLabel.label); });
      deactBtn.addEventListener("click", async function () {
        var uid = toggleBtn.getAttribute("data-uid");
        deactBtn.disabled = true; deactBtn.textContent = "جارٍ التنفيذ…";
        var r = await adminToggleActive(uid, false);
        var msgEl = document.querySelector(".togglemsg");
        if (r && r.error && msgEl) { msgEl.textContent = "تعذّر: " + r.error; deactBtn.disabled = false; deactBtn.textContent = "تأكيد التعطيل"; }
      });
    }
    // course/section permission editing
    var permBox = document.getElementById("permCourseBox");
    if (permBox) {
      permBox.querySelectorAll("[data-permcourse]").forEach(function (chip) {
        chip.addEventListener("click", function () { chip.classList.toggle("on"); });
      });
    }
    var permAll = wrap.querySelector('[data-act="perm-all"]'), permNone = wrap.querySelector('[data-act="perm-none"]');
    if (permAll) permAll.addEventListener("click", function () { wrap.querySelectorAll("[data-permcourse]").forEach(function (c) { c.classList.add("on"); }); });
    if (permNone) permNone.addEventListener("click", function () { wrap.querySelectorAll("[data-permcourse]").forEach(function (c) { c.classList.remove("on"); }); });
    wrap.querySelectorAll("[data-permsection]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.classList.toggle("on");
        btn.textContent = on ? "مفعّل" : "متوقف";
      });
    });
    var permSave = wrap.querySelector('[data-act="perm-save"]');
    if (permSave) {
      permSave.addEventListener("click", async function () {
        var uid = permSave.getAttribute("data-uid");
        var courseChips = Array.from(wrap.querySelectorAll("[data-permcourse]"));
        var allOn = courseChips.every(function (c) { return c.classList.contains("on"); });
        var courses = allOn ? null : courseChips.filter(function (c) { return c.classList.contains("on"); }).map(function (c) { return c.getAttribute("data-permcourse"); });
        var sectionBtns = Array.from(wrap.querySelectorAll("[data-permsection]"));
        var allSecOn = sectionBtns.every(function (b) { return b.classList.contains("on"); });
        var sections = allSecOn ? null : sectionBtns.filter(function (b) { return b.classList.contains("on"); }).map(function (b) { return b.getAttribute("data-permsection"); });
        var msgEl = document.getElementById("permmsg");
        msgEl.textContent = "جارٍ الحفظ…"; permSave.disabled = true;
        var r = await adminSetPermissions(uid, courses, sections);
        permSave.disabled = false;
        if (r.error) { msgEl.textContent = "تعذّر الحفظ: " + r.error + (/unknown action|not found|404/i.test(r.error) ? " — محتاج تحدّث الـ Edge Function الأول." : ""); return; }
        msgEl.textContent = "تم الحفظ ✓";
        await loadAccountsList();
      });
    }
    var goalsSave = wrap.querySelector('[data-act="goals-save"]');
    if (goalsSave) {
      goalsSave.addEventListener("click", async function () {
        var uid = goalsSave.getAttribute("data-uid");
        var goalMin = parseInt(document.getElementById("goalMin").value, 10) || 0;
        var goalWords = parseInt(document.getElementById("goalWords").value, 10) || 0;
        var msgEl = document.getElementById("goalsmsg");
        msgEl.textContent = "جارٍ الحفظ…"; goalsSave.disabled = true;
        var r = await adminSetGoals(uid, goalMin, goalWords);
        goalsSave.disabled = false;
        if (r.error) { msgEl.textContent = "تعذّر الحفظ: " + r.error + (/unknown action|not found|404/i.test(r.error) ? " — محتاج تحدّث الـ Edge Function الأول." : ""); return; }
        msgEl.textContent = "تم الحفظ ✓";
        await loadAccountsList();
      });
    }
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
    renderAdminDashboard(stats);
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
      if (r.name === "exp" && !dirty["meta:exp"]) state.exp = Object.assign({ categories: [], items: [], salary: {}, budgets: {}, recurring: [] }, r.data);
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
    state.exp = { categories: [], items: [], salary: {}, budgets: {}, recurring: [] }; state.expMonth = null; state.expAdd = false; state.expCat = ""; state.expNewCat = false; state.expSalEdit = false;
    state.loaded = false; ready.days = ready.settings = ready.learn = ready.exp = false;
    state.quiz = null; state.card = null; state.spk = null; state.wd = null; state.weakTab = "all"; state.lv = { mode: "courses" }; state.tab = "home"; state.pv = "today"; state.hv = "dashboard"; state.az = null; state.azProgress = {}; state.azOpen = {}; panelCache = {};
    resetPermissions(); // clear any restriction the previous account left behind
    $("#pager").scrollTo({ left: 0 }); render(); showLock("");
  }
  $("#lockform").addEventListener("submit", function (e) { e.preventDefault(); var v = $("#pin").value.trim(); if (v) unlock(v); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && state.mode === "supa" && store.uid) loadSupa(false); });

