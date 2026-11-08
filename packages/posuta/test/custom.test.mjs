// A poster built from the tools only (test/fixtures/custom): its own layout on <Canvas>, no
// theme.css, a CSS grid, a hand-drawn SVG, a chart and APA references. It must build and export.
// Its /tailwind/ page mixes posuta's theme, Figure parts and Tailwind v4.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dir = fileURLToPath(new URL("fixtures/custom/", import.meta.url));
const cli = fileURLToPath(new URL("../bin/posuta.mjs", import.meta.url));
const out = mkdtempSync(join(tmpdir(), "posuta-custom-"));
const pdf = (...args) => spawnSync(process.execPath, [cli, "pdf", "--dist", join(dir, "dist"), "--no-png", ...args], { encoding: "utf8" });

test("a poster built from the tools only builds, exports, and names an overflowing block", { timeout: 180_000 }, () => {
  const build = spawnSync(join(dir, "node_modules/.bin/astro"), ["build"], { cwd: dir, encoding: "utf8" });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  assert.match(readFileSync(join(dir, "dist/index.html"), "utf8"), /<h2[^>]*data-plugin/, "the author's rehype plugin ran");

  const ok = pdf("--out", join(out, "poster.pdf"));
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(existsSync(join(out, "poster.pdf")));

  const over = pdf("--page", "/overflow/", "--out", join(out, "overflow.pdf"));
  assert.equal(over.status, 1);
  assert.match(over.stderr, /"tall figure" runs \d+ mm past the bottom/);
  assert.doesNotMatch(over.stderr, /"Method"/);

  const tw = pdf("--page", "/tailwind/", "--out", join(out, "tailwind.pdf"));
  assert.equal(tw.status, 0, tw.stderr);
});

test("Tailwind: its reset sits under posuta, its utilities over it", async () => {
  const dist = join(dir, "dist");
  const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
  const server = createServer((req, res) => {
    let f = join(dist, req.url.split("?")[0]);
    try { if (statSync(f).isDirectory()) f = join(f, "index.html"); res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream" }).end(readFileSync(f)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/tailwind/`, { waitUntil: "networkidle" });
    const got = await page.evaluate(() => {
      const css = (sel) => getComputedStyle(document.querySelector(sel));
      const img = document.querySelector("a > .posuta-media");
      return {
        h2: css("h2").fontSize,                                 // theme (1.47rem at 15px), not Tailwind's reset
        caption: css("p.posuta-caption").color,                 // text-red-600 over the theme's muted colour
        half: Math.round(img.getBoundingClientRect().width / img.parentElement.parentElement.clientWidth * 10), // w-1/2 over base.css's 100%
        still: css("img[data-print=only]").display,             // a video's print frame is hidden on screen
        ref: [document.querySelector("ul.posuta-refs > li#ref-bostock2011d3")?.textContent.slice(0, 11),
          document.querySelector("a[href='#ref-bostock2011d3']")?.textContent], // References parts, in a list of our own
      };
    });
    assert.equal(got.h2, "22.05px");
    assert.match(got.caption, /^oklch\(0\.577/);
    assert.ok(got.half >= 4 && got.half <= 5, `image is ${got.half}/10 of the figure`);
    assert.equal(got.still, "none");
    assert.deepEqual(got.ref, ["[1] Bostock", "1"]);
  } finally {
    await browser.close();
    server.close();
  }
});
