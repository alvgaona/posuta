#!/usr/bin/env node
// posuta pdf: export a built poster (dist/) to a one-page vector PDF at the paper size.
//
//   posuta pdf [--dist dist] [--page /] [--out dist/poster.pdf] [--print "A1 landscape"] [--base /repo/]
//
// Fails, naming the section, if any content runs past the printed canvas.
import { createReadStream, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { printCss } from "../src/print.js";

const usage = `usage: posuta pdf [--dist dist] [--page /] [--out <dist>/poster.pdf] [--print "A1 landscape"] [--base /]`;
const [cmd, ...rest] = process.argv.slice(2);
if (cmd !== "pdf") { console.error(usage); process.exit(cmd ? 1 : 0); }
const { values: opt } = parseArgs({
  args: rest,
  options: {
    dist: { type: "string", default: "dist" },
    page: { type: "string", default: "/" },
    out: { type: "string" },
    print: { type: "string" },
    base: { type: "string", default: process.env.BASE_PATH ?? "/" },
  },
});
const dist = resolve(opt.dist);
const out = resolve(opt.out ?? join(dist, "poster.pdf"));
const base = ("/" + opt.base + "/").replace(/\/+/g, "/");

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json" };

// A static server for dist/, so absolute asset paths (/_astro/…) resolve as on the real host.
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.startsWith(base)) path = "/" + path.slice(base.length);
  let file = join(dist, path);
  if (!file.startsWith(dist + sep) && file !== dist) { res.writeHead(403).end(); return; }
  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    statSync(file);
  } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}${base}${opt.page.replace(/^\//, "")}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  const res = await page.goto(url, { waitUntil: "networkidle" });
  if (!res?.ok()) throw new Error(`could not open ${url} (${res?.status()}); did you run astro build?`);
  if (opt.print) await page.addStyleTag({ content: `@media print{${printCss(opt.print)}}` });

  // Lay the page out at the paper size before measuring.
  const size = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return { w: s.getPropertyValue("--paper-w"), h: s.getPropertyValue("--paper-h") };
  });
  const mm = (v) => parseFloat(v);
  if (!size.w) throw new Error(`${url} is not a posuta poster (no --paper-w); is its layout posuta/Poster.astro?`);
  const px = (v) => Math.round((mm(v) * 96) / 25.4);
  await page.setViewportSize({ width: px(size.w), height: px(size.h) });
  await page.evaluate(() => document.fonts.ready);

  const overflow = await page.evaluate(() => {
    const poster = document.querySelector(".poster");
    const pad = getComputedStyle(poster);
    const box = poster.getBoundingClientRect();
    const limit = { bottom: box.bottom - parseFloat(pad.paddingBottom), right: box.right - parseFloat(pad.paddingRight) };
    const toMm = (v) => Math.round((v * 25.4) / 96);
    const name = (el) => el.querySelector("h2")?.textContent.trim() || (el.matches("header") ? "the title block" : el.matches("footer") ? "the footer" : el.className);
    const found = [];
    for (const el of poster.querySelectorAll(".hero, .posuta-section, footer")) {
      const r = el.getBoundingClientRect();
      const wide = Math.max(r.right - limit.right, el.scrollWidth - el.clientWidth);
      if (r.bottom > limit.bottom + 1) found.push(`"${name(el)}" runs ${toMm(r.bottom - limit.bottom)} mm past the bottom`);
      else if (wide > 1) found.push(`"${name(el)}" is ${toMm(wide)} mm too wide`);
    }
    return found;
  });
  if (overflow.length) {
    throw new Error(`content does not fit on the ${size.w} × ${size.h} canvas:\n  ${overflow.join("\n  ")}\n` +
      "Shorten it, change the column spans, or pick a larger print size.");
  }

  await mkdir(dirname(out), { recursive: true });
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  console.log(`${out}: ${size.w} × ${size.h}`);
} catch (e) {
  console.error(`posuta pdf: ${e.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
