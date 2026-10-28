#!/usr/bin/env node
// Content checks for courses/*.json — run before committing course edits:
//   node scripts/validate-courses.js            (all courses)
//   node scripts/validate-courses.js iso en     (selected courses)
// Fails (exit 1) on broken questions; prints warnings for thin units.
"use strict";
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "courses");
const only = process.argv.slice(2);
let errors = 0, warnings = 0;
function err(c, where, msg) { errors++; console.log(`✗ ${c} ${where}: ${msg}`); }
function warn(c, where, msg) { warnings++; console.log(`! ${c} ${where}: ${msg}`); }
function checkQ(c, where, q, nPts) {
  if (!q.q || typeof q.q !== "string") err(c, where, "missing question text");
  if (q.t === "mcq") {
    if (!Array.isArray(q.o) || q.o.length < 2) err(c, where, "mcq needs 2+ options");
    else {
      if (q.o.indexOf(q.a) < 0) err(c, where, `answer not among options: ${q.a}`);
      if (new Set(q.o).size !== q.o.length) err(c, where, "duplicate options");
    }
    if (q.wrong) Object.keys(q.wrong).forEach(k => { if (!q.o || q.o.indexOf(k) < 0) err(c, where, `wrong-explanation for unknown option: ${k}`); if (k === q.a) err(c, where, "wrong-explanation given for the correct answer"); });
  } else if (q.t === "fill") {
    if (!Array.isArray(q.a) || !q.a.length || q.a.some(x => !String(x).trim())) err(c, where, "fill needs a non-empty answer array");
  } else if (q.t === "order") {
    if (!Array.isArray(q.words) || !Array.isArray(q.a) || q.words.map(w => w.toLowerCase()).sort().join("|") !== q.a.map(w => w.toLowerCase()).sort().join("|")) err(c, where, "order words/answer mismatch");
  } else if (q.t === "tf") {
    if (typeof q.a !== "boolean") err(c, where, "tf answer must be true/false");
  } else if (q.t === "match") {
    if (!Array.isArray(q.pairs) || q.pairs.length < 2) err(c, where, "match needs 2+ pairs");
  } else err(c, where, `unknown type ${q.t}`);
  if (!q.why) warn(c, where, "no explanation (why)");
  if (q.pt != null && (q.pt < 1 || q.pt > nPts)) err(c, where, `pt ${q.pt} out of range (unit has ${nPts} points)`);
}
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, "")).filter(c => !only.length || only.includes(c));
files.forEach(c => {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(dir, c + ".json"), "utf8")); } catch (e) { err(c, "file", e.message); return; }
  if (!d.title || !Array.isArray(d.units)) { err(c, "file", "needs title and units"); return; }
  const ids = new Set();
  d.units.forEach((u, ui) => {
    const where = `unit ${u.id || ui}`;
    if (!u.id || ids.has(u.id)) err(c, where, "missing or duplicate unit id"); ids.add(u.id);
    if (!u.title) err(c, where, "missing title");
    if (!Array.isArray(u.pts) || !u.pts.length) err(c, where, "no lesson points");
    if (!Array.isArray(u.qs) || u.qs.length < 3) err(c, where, "needs 3+ questions");
    ["goals", "summary", "mistakes"].forEach(k => { if (u[k] != null && (!Array.isArray(u[k]) || u[k].some(x => typeof x !== "string"))) err(c, where, `${k} must be a list of strings`); });
    if (!u.kind && !u.goals) warn(c, where, "no goals");
    if (!u.kind && !u.summary) warn(c, where, "no summary");
    (u.qs || []).forEach((q, qi) => checkQ(c, `${where} q${qi + 1}`, q, (u.pts || []).length));
  });
  (d.examBank || []).forEach((q, qi) => checkQ(c, `bank q${qi + 1}`, q, 0));
  const vids = new Set();
  (d.vocab || []).forEach((v, vi) => { if (!v.id || vids.has(v.id)) err(c, `vocab ${vi}`, "missing or duplicate id"); vids.add(v.id); if (!v.en || !v.ar) err(c, `vocab ${v.id}`, "needs en and ar"); });
  const qn = d.units.reduce((s, u) => s + (u.qs || []).length, 0);
  console.log(`• ${c}: ${d.units.length} units, ${qn} questions, ${(d.vocab || []).length} terms`);
});
console.log(`\n${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);
