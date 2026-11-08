// Observable Plot → SVG markup, with posuta's defaults (theme font, transparent background) and
// $…$ in any text rendered with KaTeX.
import * as Plot from "@observablehq/plot";
import { dom, katex as buildKatex } from "#dom";

let katex = buildKatex; // null in the browser until plotLive needs it
const MATH = /\$[^$]+\$/;
const SVG = "http://www.w3.org/2000/svg";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const tex = (k, s) => s.split(/(\$[^$]+\$)/).map((p) => (p.length > 2 && p.startsWith("$") && p.endsWith("$")
  ? k.renderToString(p.slice(1, -1), { throwOnError: true, output: "html" }) : esc(p))).join("");
const inherited = (el, name) => el.closest(`[${name}]`)?.getAttribute(name);

/**
 * Replace text holding $…$ with KaTeX, in place: SVG text becomes a foreignObject at the same
 * spot and alignment; HTML text (legends) gets the markup directly. Returns how many it changed.
 */
export function mathify(root, k) {
  let n = 0;
  for (const t of [...root.querySelectorAll("text")]) {
    if (!MATH.test(t.textContent)) continue;
    // shortcut: a multi-line label (several tspans) becomes one line; split it into two labels if needed.
    const anchor = inherited(t, "text-anchor") ?? "start";
    // Plot nudges text with dy, or with an em-valued y; both mean vertical alignment here.
    const yEm = /em$/.test(t.getAttribute("y") ?? "") ? parseFloat(t.getAttribute("y")) : 0;
    const dy = parseFloat(inherited(t, "dy") ?? "0") + yEm;
    const tx = { start: "0", middle: "-50%", end: "-100%" }[anchor] ?? "0";
    const ty = dy > 0.6 ? "0" : dy > 0.1 ? "-50%" : "-80%"; // Plot's dy: .71em hangs, .32em centres, 0 sits on the baseline
    const fill = inherited(t, "fill");
    const fo = t.ownerDocument.createElementNS(SVG, "foreignObject");
    for (const a of ["x", "y", "transform"]) if (t.getAttribute(a) && !/em$/.test(t.getAttribute(a))) fo.setAttribute(a, t.getAttribute(a));
    fo.setAttribute("width", "1");
    fo.setAttribute("height", "1");
    fo.setAttribute("overflow", "visible");
    const color = fill && fill !== "currentColor" ? `color:${fill};` : "";
    fo.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" class="posuta-tex" style="${color}transform:translate(${tx},${ty})">${tex(k, t.textContent)}</div>`;
    t.replaceWith(fo);
    n++;
  }
  for (const el of [root, ...root.querySelectorAll("*")]) {
    if (el.closest("svg")) continue;
    for (const node of [...el.childNodes]) {
      if (node.nodeType !== 3 || !MATH.test(node.textContent)) continue;
      const span = el.ownerDocument.createElement("span");
      span.innerHTML = tex(k, node.textContent);
      node.replaceWith(span);
      n++;
    }
  }
  return n;
}

/** Plot options with the theme defaults filled in. */
export function withDefaults(options) {
  return {
    ...options,
    style: { background: "transparent", fontFamily: "var(--font-body)", ...options.style },
  };
}

/** Render to an element. At build time math is rendered too; in the browser use plotLive. */
export function plot(options) {
  const el = Plot.plot({ ...withDefaults(options), document: dom() });
  if (katex) mathify(el, katex);
  return el;
}

/** Render in the browser, loading KaTeX the first time a chart has $…$ in it. */
export async function plotLive(options) {
  const el = plot(options);
  if (!katex && MATH.test(el.textContent)) {
    katex = (await import("katex")).default;
    mathify(el, katex);
  }
  return el;
}

/** Render to markup; works at build time, with no browser. */
export const renderPlot = (options) => plot(options).outerHTML;

export { Plot };

/**
 * Add a tooltip and a crosshair that follow the pointer, built from the first mark with x and y
 * channels. They draw nothing until the pointer moves, so print and no-JS output are unchanged.
 */
export function withPointer(options) {
  const mark = (options.marks ?? []).flat(Infinity).find((m) => m?.channels?.x && m.channels.y && m.data);
  if (!mark) return options;
  const ch = Object.fromEntries(["x", "y", "stroke", "fill", "z"]
    .filter((k) => mark.channels[k]).map((k) => [k, mark.channels[k].value]));
  const { x, y } = ch;
  return {
    ...options,
    marks: [...options.marks, Plot.crosshair(mark.data, { x, y }), Plot.tip(mark.data, Plot.pointer(ch))],
  };
}
