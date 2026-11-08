// posuta pdf on hand-written pages: what fits exports, what overflows fails and is named.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const cli = new URL("../bin/posuta.mjs", import.meta.url).pathname;
// A 100 mm square canvas around any markup, with no posuta classes inside.
const canvas = (body) => `<!doctype html><style>@media print{@page{size:100mm 100mm;margin:0}
:root{--paper-w:100mm;--paper-h:100mm}} body{margin:0} .posuta-canvas{height:100mm;overflow:hidden;padding:5mm;box-sizing:border-box}</style>
<div class="posuta-canvas">${body}</div>`;
const page = (height) => canvas(`<section><h2>Results</h2><div style="height:${height}"></div></section>`);

function run(html) {
  const dist = mkdtempSync(join(tmpdir(), "posuta-"));
  writeFileSync(join(dist, "index.html"), html);
  const r = spawnSync(process.execPath, [cli, "pdf", "--dist", dist], { encoding: "utf8" });
  return { ...r, pdf: join(dist, "poster.pdf") };
}

test("a poster that fits exports one PDF, tagged, with its headings as an outline", () => {
  const r = run(page("20mm"));
  assert.equal(r.status, 0, r.stderr);
  const pdf = readFileSync(r.pdf, "latin1");
  assert.match(pdf, /\/StructTreeRoot/);
  assert.match(pdf, /\/Outlines/);
});

test("an overflowing section fails the export and is named", () => {
  const r = run(page("200mm"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /"Results" runs \d+ mm past the bottom/);
  assert.ok(!existsSync(r.pdf));
});

test("nested blocks: the innermost one is named, not its column", () => {
  const r = run(canvas(`<div style="display:grid;grid-template-columns:1fr 1fr">
    <div><article><h3>Method</h3><p>fits</p></article></div>
    <div><article><h3>Findings</h3><div style="height:200mm"></div></article></div></div>`));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /"Findings" runs \d+ mm past the bottom/);
  assert.doesNotMatch(r.stderr, /Method/);
});

test("data-name names a block without a heading; width overflow is caught", () => {
  const r = run(canvas(`<div data-name="logo strip" style="width:150mm;height:5mm"></div>`));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /"logo strip" is \d+ mm too wide/);
});

test("with nothing named, the canvas itself is reported", () => {
  const r = run(canvas(`<p>text</p><div style="height:120mm"></div>`));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /the poster runs \d+ mm past the bottom/);
});

test("a page without a canvas is refused", () => {
  const r = run(`<!doctype html><style>@media print{:root{--paper-w:100mm;--paper-h:100mm}}</style><h1>hi</h1>`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not a posuta page: wrap it in <Canvas>/);
});
