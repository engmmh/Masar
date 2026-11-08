"use strict";
// Runs right after the welcome card in the markup, before first paint, so a returning
// visitor never sees it flash.
try { if (localStorage.getItem("masar:onboarded")) document.getElementById("welcome").hidden = true; } catch (e) { }
// Keep the browser's install offer so the «نزّل التطبيق» button on the lock screen can
// show it; registered this early because the event can fire before the app scripts run.
window.__masarInstall = null;
window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); window.__masarInstall = e; });
