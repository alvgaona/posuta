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

test("print scale: a factor on the type size, checked", async () => {
  const { paper, printCss } = await import("../src/print.js");
  assert.equal(paper("A1").text, 1);
  assert.equal(paper({ size: "A0", scale: 0.8 }).text, 0.8);
  assert.match(printCss({ width: "400mm", height: "800mm", scale: 0.75 }), /--print-text:0\.75/);
  assert.throws(() => paper({ size: "A0", scale: "big" }), /print scale/);
});

test("bibtex: an entry for the poster, its key from author, year and title", async () => {
  const { bibtex } = await import("../src/bibtex.js");
  const b = bibtex({ title: "Tilted Rotors & Faults", authors: ["Álvaro Gaona", "Giribet, Juan"], year: 2026, event: "ICRA 2026", doi: "10.5281/zenodo.1" });
  assert.match(b, /^@misc\{gaona2026tilted,\n/);
  assert.match(b, /author +=\ \{Álvaro Gaona and Giribet, Juan\}/);
  assert.match(b, /title +=\ \{\{Tilted Rotors \\& Faults\}\}/);
  assert.match(b, /howpublished = \{Poster, ICRA 2026\}/);
  assert.match(b, /doi +=\ \{10\.5281\/zenodo\.1\}\n\}$/);
  assert.throws(() => bibtex({ title: "x", authors: [] }), /needs title, authors and year/);
});
