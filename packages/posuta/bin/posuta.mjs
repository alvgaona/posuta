#!/usr/bin/env node
// posuta pdf: export a built poster (dist/) to a one-page vector PDF at the paper size, plus
// og.png, the preview image for social sharing.
//
//   posuta pdf [--dist dist] [--page /] [--out dist/poster.pdf] [--print "A1 landscape"] [--base /repo/] [--no-png]
//   posuta install            download the browser posuta pdf uses (Playwright's Chromium)
//
// Fails if content runs past the printed canvas, naming the innermost block that does: an element
// led by a heading (h1–h4) or with a data-name attribute.
import { spawnSync } from "node:child_process";
import { createReadStream, statSync } from "node:fs";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { overflow } from "../src/overflow.js";
import { printCss } from "../src/print.js";

const usage = `usage: posuta pdf [--dist dist] [--page /] [--out <dist>/<page>/poster.pdf] [--print "A1 landscape"] [--base /] [--no-png]
       posuta install [--with-deps]`;
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "install") {
  const cli = join(dirname(createRequire(import.meta.url).resolve("playwright/package.json")), "cli.js");
  const r = spawnSync(process.execPath, [cli, "install", "--only-shell", "chromium", ...rest], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}
if (cmd !== "pdf") { console.error(usage); process.exit(cmd ? 1 : 0); }
const { values: opt } = parseArgs({
  args: rest,
  allowNegative: true,
  options: {
    png: { type: "boolean", default: true },
    dist: { type: "string", default: "dist" },
    page: { type: "string", default: "/" },
    out: { type: "string" },
    print: { type: "string" },
    base: { type: "string", default: process.env.BASE_PATH ?? "/" },
  },
});
const dist = resolve(opt.dist);
const pageDir = join(dist, opt.page); // og.png goes next to the page, where its og:image tag points
const out = resolve(opt.out ?? join(pageDir, "poster.pdf"));
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
  if (!size.w) throw new Error(`${url} has no print size (--paper-w): wrap it in <Canvas>, or pass --print`);
  const px = (v) => Math.round((mm(v) * 96) / 25.4);
  await page.setViewportSize({ width: px(size.w), height: px(size.h) });
  await page.evaluate(() => document.fonts.ready);

  const found = await page.evaluate(overflow);
  if (!found) throw new Error(`${url} is not a posuta page: wrap it in <Canvas>`);
  if (found.length) {
    throw new Error(`content does not fit on the ${size.w} × ${size.h} canvas:\n  ${found.join("\n  ")}\n` +
      "Shorten it, change the column spans, or pick a larger print size.");
  }

  await mkdir(dirname(out), { recursive: true });
  // tagged: readable by screen readers and text extraction; outline: the headings as bookmarks.
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
  console.log(`${out}: ${size.w} × ${size.h}`);

  if (opt.png) {
    // The screen layout's first 1200 × 630 px: the size link previews use.
    const png = join(pageDir, "og.png");
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.screenshot({ path: png });
    console.log(png);
  }
} catch (e) {
  console.error(`posuta pdf: ${e.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
