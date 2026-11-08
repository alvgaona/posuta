// The dev print preview (?print): print CSS on screen, the overflow check, a banner.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { chromium } from "playwright";

const src = new URL("../src/", import.meta.url);
// Screen and print layouts differ: on screen the section fits, in print (100 mm canvas) it doesn't.
const html = `<!doctype html><style>@media print{:root{--paper-w:100mm;--paper-h:100mm}
.posuta-canvas{width:100mm;height:100mm;overflow:hidden;padding:5mm;box-sizing:border-box} .tall{height:200mm}}
@media screen{.only-print{display:none}}</style>
<div class="posuta-canvas"><section><h2>Results</h2><div class="tall"></div></section><p class="only-print">print</p></div>
<script type="module">import { preview } from "/src/preview.js"; preview();</script>`;

test("?print previews the print layout and marks what overflows", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.route("http://posuta.test/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/") return route.fulfill({ contentType: "text/html", body: html });
      route.fulfill({ contentType: "text/javascript", body: readFileSync(new URL(path.slice(5), src)) });
    });
    await page.goto("http://posuta.test/");
    await page.waitForSelector(".posuta-preview-banner");
    const got = await page.evaluate(() => ({
      banner: document.querySelector(".posuta-preview-banner").textContent,
      marked: [...document.querySelectorAll("[data-posuta-overflow]")].map((el) => el.tagName),
      printOnly: getComputedStyle(document.querySelector(".only-print")).display,
      scaled: document.querySelector(".posuta-canvas").style.transform,
    }));
    assert.match(got.banner, /Does not fit on 100mm × 100mm:\n"Results" runs \d+ mm past the bottom/);
    assert.deepEqual(got.marked, ["SECTION"]);
    assert.equal(got.printOnly, "block"); // the screen rule no longer applies
    assert.match(got.scaled, /^scale\(/);
  } finally {
    await browser.close();
  }
});
