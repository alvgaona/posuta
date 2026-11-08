// The tools under the components: tex, diagram layout/draw, citation styles.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import { draw, layout, renderDiagram } from "../src/diagram.js";
import { formatReference } from "../src/remark-cite.js";
import { tex, texSvg } from "../src/tex.js";

const fixtures = fileURLToPath(new URL("fixtures/", import.meta.url));

test("tex renders $…$ and escapes the rest", () => {
  const html = tex("a < b and $\\omega_n$");
  assert.match(html, /^a &lt; b and <span class="katex">/);
  assert.equal(tex("no maths"), "no maths");
});

test("texSvg: plain text is <text>, maths is a foreignObject on the same anchor", () => {
  assert.equal(texSvg("Plant", 10, 20, { anchor: "middle", class: "t", size: 14 }),
    '<text class="t" x="10" y="20" text-anchor="middle" fill="currentColor" font-size="14">Plant</text>');
  const fo = texSvg("$G(s)$", 10, 20, { anchor: "end" });
  assert.match(fo, /^<foreignObject x="10" y="20" width="1" height="1" overflow="visible">/);
  assert.match(fo, /translate\(-100%,-80%\)/);
  assert.match(fo, /class="katex"/);
});

test("diagram: layout gives geometry, draw turns an edited layout into SVG", () => {
  const spec = { boxes: { a: { at: [0, 0], title: "A" }, b: { at: [5, 0], title: "B" } }, arrows: ["a -> b: go"] };
  const g = layout(spec);
  assert.deepEqual(g.boxes.map((b) => [b.name, b.x, b.y, b.w, b.h]), [["a", 0, 0, 120, 56], ["b", 200, 0, 120, 56]]);
  assert.deepEqual(g.arrows[0].pts, [[120, 28], [200, 28]]);
  assert.deepEqual(g.arrows[0].labelAt, { x: 160, y: 21, anchor: "middle" });
  assert.equal(draw(g), renderDiagram(spec));
  g.boxes[1].y = 40;
  assert.match(draw(g), /<rect class="box" x="200" y="40"/);
});

test("formatReference: built-in CSL styles, a .csl file, and an unknown name", () => {
  const [entry] = new Cite(readFileSync(fixtures + "refs.bib", "utf8")).data;
  assert.match(formatReference(entry), /^Bostock M, Ogievetsky V, Heer J\. D³: Data-Driven Documents\./);
  const apa = formatReference(entry, "apa");
  assert.match(apa, /^Bostock, M\., Ogievetsky, V\., & Heer, J\. \(2011\)/);
  assert.doesNotMatch(apa, /doi/i);
  assert.equal(formatReference(entry, fixtures + "title-only.csl"), "D³: DATA-DRIVEN DOCUMENTS");
  assert.throws(() => formatReference(entry, "nope"), /unknown citation style "nope"/);
});
