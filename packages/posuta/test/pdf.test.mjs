// posuta pdf on hand-written pages: one that fits, one with a section past the canvas.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const cli = new URL("../bin/posuta.mjs", import.meta.url).pathname;
const page = (height) => `<!doctype html><style>@media print{@page{size:100mm 100mm;margin:0}
:root{--paper-w:100mm;--paper-h:100mm}} .poster{height:100mm;overflow:hidden;padding:5mm}</style>
<div class="poster"><section class="posuta-section"><h2>Results</h2><div style="height:${height}"></div></section></div>`;

function run(html) {
  const dist = mkdtempSync(join(tmpdir(), "posuta-"));
  writeFileSync(join(dist, "index.html"), html);
  const r = spawnSync(process.execPath, [cli, "pdf", "--dist", dist], { encoding: "utf8" });
  return { ...r, pdf: join(dist, "poster.pdf") };
}

test("a poster that fits exports one PDF", () => {
  const r = run(page("20mm"));
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(r.pdf));
});

test("an overflowing section fails the export and is named", () => {
  const r = run(page("200mm"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /"Results" runs \d+ mm past the bottom/);
  assert.ok(!existsSync(r.pdf));
});
