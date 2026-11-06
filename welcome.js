"use strict";
// Runs right after the welcome card in the markup, before first paint, so a returning
// visitor never sees it flash.
try { if (localStorage.getItem("masar:onboarded")) document.getElementById("welcome").hidden = true; } catch (e) { }
