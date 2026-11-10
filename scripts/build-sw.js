// Writes the app-shell list and a content-hash version into sw.js.
// Run after any change to the app's files:  node scripts/build-sw.js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const refs = new Set(["index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"]);
for (const m of html.matchAll(/<script src="([^":]+)"/g)) refs.add(m[1]);
for (const m of html.matchAll(/<link[^>]+href="([^":]+)"/g)) refs.add(m[1]);
const files = [...refs].sort();
const h = crypto.createHash("sha1");
for (const f of files) { const p = path.join(root, f); if (!fs.existsSync(p)) throw new Error("missing " + f); h.update(f); h.update(fs.readFileSync(p)); }
const swPath = path.join(root, "sw.js"); let sw = fs.readFileSync(swPath, "utf8");
const swBody = sw.replace(/\/\/ BUILD:START[\s\S]*?\/\/ BUILD:END/, ""); h.update(swBody);
const ver = "masar-" + h.digest("hex").slice(0, 10);
const block = "// BUILD:START\nvar CACHE_NAME = " + JSON.stringify(ver) + ";\nvar PRECACHE = " + JSON.stringify(["./index.html"].concat(files.filter(f => f !== "index.html").map(f => "./" + f)), null, 2) + ";\n// BUILD:END";
sw = sw.replace(/\/\/ BUILD:START[\s\S]*?\/\/ BUILD:END/, block);
fs.writeFileSync(swPath, sw);
console.log(ver, files.length + " files");
