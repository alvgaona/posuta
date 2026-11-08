// An SVG file as inline markup for <Figure.Media>: the file's own attributes kept, `class` added to
// its own, other attributes set, and $…$ in its text rendered with KaTeX (as in charts).
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
import { katex } from "#dom";
import { mathify } from "./plot.js";

/** @param {string} path @param {Record<string, unknown>} attrs */
export function inlineSvg(path, { class: cls, ...attrs } = {}) {
  // Parsed as HTML, like the page it goes into: browsers restore SVG tag case (linearGradient).
  const text = readFileSync(path, "utf8");
  const { document } = parseHTML(`<!doctype html><html><body>${text}</body></html>`);
  const svg = document.querySelector("svg");
  if (!svg) throw new Error(`posuta: ${path} has no <svg> element`);
  // linkedom reads the HTML in a foreignObject (KaTeX from texSvg) as SVG and writes its empty
  // spans as <span/>, which browsers misread; set the file's own markup again, parsed as HTML.
  const raw = [...text.matchAll(/<foreignObject\b[^>]*>([\s\S]*?)<\/foreignObject>/gi)].map((m) => m[1]);
  svg.querySelectorAll("foreignobject").forEach((fo, i) => { fo.innerHTML = raw[i] ?? fo.innerHTML; });
  for (const a of ["xmlns", "xmlns:xlink", "version"]) svg.removeAttribute(a); // not needed inline
  if (cls) svg.classList.add(...String(cls).split(/\s+/).filter(Boolean));
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    svg.setAttribute(k, v === true ? "" : String(v));
  }
  mathify(svg, katex);
  return svg.outerHTML;
}
