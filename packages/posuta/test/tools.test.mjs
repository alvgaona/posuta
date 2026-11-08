// The tools under the components: tex and citation styles.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
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

test("formatReference: built-in CSL styles, a .csl file, and an unknown name", () => {
  const [entry] = new Cite(readFileSync(fixtures + "refs.bib", "utf8")).data;
  assert.match(formatReference(entry), /^Bostock M, Ogievetsky V, Heer J\. D³: Data-Driven Documents\./);
  const apa = formatReference(entry, "apa");
  assert.match(apa, /^Bostock, M\., Ogievetsky, V\., & Heer, J\. \(2011\)/);
  assert.doesNotMatch(apa, /doi/i);
  assert.equal(formatReference(entry, fixtures + "title-only.csl"), "D³: DATA-DRIVEN DOCUMENTS");
  assert.throws(() => formatReference(entry, "nope"), /unknown citation style "nope"/);
});
