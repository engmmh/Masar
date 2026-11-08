"use strict";
  /* ---------------- إضاءة اللمس — a soft caramel glow under the finger ----------------
     A full-screen canvas that never takes input (pointer-events: none). While a finger
     is down a soft halo follows it and leaves a short trail that fades within ~0.4s; a
     plain tap gives a small ring that spreads and fades. Uses touch events (not pointer
     events) because the browser cancels pointer events once a scroll starts, and the
     glow is meant to follow scrolling too. Drawing only runs while something is visible.
     Off when: the setting is off, the OS asks for reduced motion, typing in a field, or
     reading a Mushaf page. */
  (function () {
    var cv = document.createElement("canvas");
    cv.id = "touchGlow"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d"), dpr = 1, W = 0, H = 0;
    var R = 72, TRAIL_LIFE = 520, HEAD_FADE = 280, RING_LIFE = 420;
    var trail = [], rings = [], head = null, down = false, raf = 0, dark = false, startT = 0, moved = false;
    var reduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); window.addEventListener("resize", size);

    function enabled() { return !(state.settings && state.settings.touchGlow === false) && !reduce.matches; }
    function isDark() {
      var t = document.documentElement.getAttribute("data-theme");
      return t === "dark" || (!t && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    }
    function skip(target) {
      return !!(target && target.closest && target.closest("input, textarea, select, [contenteditable], .q-page"));
    }
    function blob(x, y, r, a) {
      if (a <= 0.004) return;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (dark) {
        g.addColorStop(0, "rgba(255, 222, 176, " + a + ")");
        g.addColorStop(0.45, "rgba(226, 172, 114, " + a * 0.5 + ")");
        g.addColorStop(1, "rgba(226, 172, 114, 0)");
      } else {
        g.addColorStop(0, "rgba(214, 150, 82, " + a + ")");
        g.addColorStop(0.5, "rgba(214, 150, 82, " + a * 0.45 + ")");
        g.addColorStop(1, "rgba(214, 150, 82, 0)");
      }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    function frame() {
      raf = 0;
      var now = performance.now(), base = dark ? 0.34 : 0.2;
      ctx.clearRect(0, 0, W, H);
      trail = trail.filter(function (p) { return now - p.t < TRAIL_LIFE; });
      trail.forEach(function (p) {
        var k = 1 - (now - p.t) / TRAIL_LIFE;
        blob(p.x, p.y, R * (0.35 + 0.45 * k), base * 0.55 * k * k);
      });
      if (head) {
        var ha = down ? Math.min(1, (now - head.t0) / 120) : Math.max(0, 1 - (now - head.up) / HEAD_FADE);
        blob(head.x, head.y, R, base * ha);
        if (!down && ha <= 0) head = null;
      }
      rings = rings.filter(function (g) { return now - g.t < RING_LIFE; });
      rings.forEach(function (g) {
        var k = (now - g.t) / RING_LIFE;
        ctx.beginPath(); ctx.arc(g.x, g.y, 10 + R * 0.75 * k, 0, Math.PI * 2);
        ctx.strokeStyle = dark ? "rgba(246, 211, 162, " + 0.4 * (1 - k) + ")" : "rgba(168, 106, 51, " + 0.28 * (1 - k) + ")";
        ctx.lineWidth = 2 * (1 - k) + 0.5; ctx.stroke();
      });
      if (head || trail.length || rings.length) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    document.addEventListener("touchstart", function (e) {
      if (!enabled() || skip(e.target)) return;
      var t = e.touches[0]; if (!t) return;
      dark = isDark(); down = true; moved = false; startT = performance.now();
      head = { x: t.clientX, y: t.clientY, t0: startT, up: 0 };
      kick();
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (!down || !head) return;
      var t = e.touches[0]; if (!t) return;
      var now = performance.now(), dx = t.clientX - head.x, dy = t.clientY - head.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) moved = true;
      // Fill in fast swipes so the trail stays a smooth ribbon, not separate dots.
      var steps = Math.min(8, Math.floor(dist / 14));
      for (var i = 1; i <= steps; i++) trail.push({ x: head.x + dx * i / (steps + 1), y: head.y + dy * i / (steps + 1), t: now });
      trail.push({ x: t.clientX, y: t.clientY, t: now });
      if (trail.length > 160) trail.splice(0, trail.length - 160);
      head.x = t.clientX; head.y = t.clientY;
      kick();
    }, { passive: true });
    function end() {
      if (!down) return;
      down = false;
      if (head) {
        head.up = performance.now();
        if (!moved && head.up - startT < 450) rings.push({ x: head.x, y: head.y, t: head.up });
      }
      kick();
    }
    document.addEventListener("touchend", function (e) { if (!e.touches.length) end(); }, { passive: true });
    document.addEventListener("touchcancel", end, { passive: true });
  })();
