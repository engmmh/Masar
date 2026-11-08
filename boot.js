"use strict";

  /* ---------------- boot ---------------- */
  // Course data (COURSES) and the Quran text (quran/quran.json, 1.4MB) are NOT
  // fetched here anymore. Both used to load unconditionally on every boot —
  // before the PIN screen, even for accounts whose permissions block those
  // sections entirely — which wasted real data on mobile. Courses now load
  // from ensureCoursesLoaded() (app.js), called once ALLOWED_COURSES is known
  // (after login, or immediately in local mode), and only for the courses that
  // account is actually permitted. The Quran text loads lazily the first time
  // the Mushaf sub-tab is opened — see the "qv" case in the click handler.
  applyTheme(getTheme());
  render();
  setInterval(tick, 1000);
  // Phase 11 — هدف يومي بالدقايق: a coarse but simple minutes-studied tracker.
  // While the person is actually on the "learn" tab, the page is visible, AND
  // they interacted within the last minute, bank half a minute every 30s — good
  // enough to drive a daily-minutes goal without wiring up a real per-action
  // stopwatch. The interaction check (added after this previously credited time
  // for an idle, forgotten-open tab) is what keeps the daily-goal number honest.
  var lastInteractionAt = Date.now();
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, function () { lastInteractionAt = Date.now(); }, { passive: true, capture: true });
  });
  function learnMinutesTick() {
    try {
      if (state.loaded && state.tab === "learn" && document.visibilityState !== "hidden" && (Date.now() - lastInteractionAt) < 60000) {
        var k = nowR().key;
        if (!state.learn.minutes) state.learn.minutes = {};
        state.learn.minutes[k] = (state.learn.minutes[k] || 0) + 0.5;
        saveMeta("learn", 2000);
      }
    } catch (e) { }
  }
  setInterval(learnMinutesTick, 30000);
  initStore();

  // Debug/test hook only — not used by the app itself, and exposes nothing that
  // isn't already visible in localStorage or the DOM. Kept so automated Playwright
  // checks (and the user's own debugging) can drive internal state/functions that
  // live inside this closure, instead of only poking at the rendered HTML.
  window.__masarDebug = { state: state, startQuiz: startQuiz, speechOK: speechOK, QINDEX: QINDEX, VOCAB_INDEX: VOCAB_INDEX, COURSES: COURSES, cardExType: cardExType, CARD_EX_TYPES: CARD_EX_TYPES,
    milestoneBoundaries: milestoneBoundaries, allMilestonesPassed: allMilestonesPassed, startMilestoneExam: startMilestoneExam,
    startWeeklyChallenge: startWeeklyChallenge, weeklyChallengeKey: weeklyChallengeKey, checkAchievements: checkAchievements, ACHIEVEMENTS: ACHIEVEMENTS,
    studyStreak: studyStreak, maybeUseStreakFreeze: maybeUseStreakFreeze, addXp: addXp, finishQuiz: finishQuiz, nowR: nowR, render: render,
    renderPt: renderPt, ptPlainText: ptPlainText, questionStemVisual: questionStemVisual,
    milestonePhaseLabel: milestonePhaseLabel, pathHTML: pathHTML };

  // Register the service worker so the app is installable on the phone's
  // home screen (standalone, no browser chrome) and still opens offline.
  // Runs after boot, never blocks it, and failure here is harmless.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { });
    });
  }

  // «نزّل التطبيق» badge under the sign-in form: hidden when already running as the
  // installed app; uses the browser's install prompt when there is one, otherwise shows
  // the two-step way to add it from the browser menu.
  (function () {
    var box = document.getElementById("instBox"), btn = document.getElementById("installBtn"), help = document.getElementById("installHelp");
    if (!box || !btn) return;
    function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }
    box.hidden = standalone();
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ios) btn.querySelector(".inst-t").innerHTML = "<small>أضف التطبيق على</small><b>iPhone</b>";
    window.addEventListener("appinstalled", function () { window.__masarInstall = null; box.hidden = true; toast("التطبيق اتثبت — افتحه من أيقونته"); });
    btn.addEventListener("click", function () {
      var ev = window.__masarInstall;
      if (ev) {
        ev.prompt();
        ev.userChoice.then(function (c) { if (c && c.outcome === "accepted") box.hidden = true; }).catch(function () { });
        window.__masarInstall = null; return;
      }
      help.textContent = ios
        ? "من Safari: اضغط زرار المشاركة (المربع اللي فيه سهم لفوق)، وبعدين «إضافة إلى الشاشة الرئيسية»."
        : "من Chrome: افتح القايمة ⋮ فوق، واختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». لو هو متثبت بالفعل، افتحه من أيقونته.";
      help.hidden = !help.hidden;
    });
  })();

  // First-run welcome screen: shown once before the lock screen, then
  // dismissed for good via a localStorage flag.
  var welcomeBtn = document.getElementById("welcomeBtn");
  if (welcomeBtn) {
    welcomeBtn.addEventListener("click", function () {
      try { localStorage.setItem("masar:onboarded", "1"); } catch (e) { }
      var w = document.getElementById("welcome");
      if (w) w.hidden = true;
    });
  }
