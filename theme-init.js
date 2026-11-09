"use strict";
// Runs in <head> before anything is drawn: applies the saved light/dark choice and the
// matching phone status-bar colour right away, so the first frame isn't drawn in the
// phone's own theme and then flipped once the app scripts load.
(function () {
  var t = "light";
  try { t = localStorage.getItem("masar:theme") || "light"; } catch (e) { }
  if (t !== "auto") document.documentElement.setAttribute("data-theme", t);
  var dark = t === "dark" || (t === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  var m = document.getElementById("themeColor");
  if (m) m.setAttribute("content", dark ? "#120D09" : "#F7F1E9");
})();
