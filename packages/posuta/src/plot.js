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

/** The first mark with x and y channels, and its channel fields: what the pointer follows. */
function pointerOf(options) {
  const mark = (options.marks ?? []).flat(Infinity).find((m) => m?.channels?.x && m.channels.y && m.data);
  if (!mark) return null;
  const ch = Object.fromEntries(["stroke", "fill", "z", "x", "y"] // series first, as in Plot's own tip
    .filter((k) => mark.channels[k]).map((k) => [k, mark.channels[k].value]));
  return { mark, ch };
}

/**
 * Add a crosshair and a highlighted point that follow the pointer. They draw nothing until the
 * pointer moves, so print and no-JS output are unchanged. The tooltip itself is HTML (attachTip),
 * because Plot's own tip is SVG text and cannot hold maths.
 */
export function withPointer(options) {
  const p = pointerOf(options);
  if (!p) return options;
  const { x, y, stroke, fill } = p.ch;
  return {
    ...options,
    marks: [...options.marks, Plot.crosshair(p.mark.data, { x, y }),
      Plot.dot(p.mark.data, Plot.pointer({ x, y, fill: stroke ?? fill ?? "currentColor", r: 4 }))],
  };
}

/** Tooltip rows for a datum: [label, value] pairs, labels from the scales, with $math$ kept. */
export function tipRows(options, d) {
  const p = pointerOf(options);
  if (!p) return [];
  const get = (f) => (typeof f === "function" ? f(d) : typeof f === "string" ? d[f] : undefined);
  const label = (k, f) => (k === "x" || k === "y" ? options[k]?.label : options.color?.label) ?? (typeof f === "string" ? f : k);
  const fmt = (v) => (typeof v === "number" && !Number.isInteger(v) ? String(+v.toPrecision(4)) : String(v));
  const seen = new Set();
  return Object.entries(p.ch).flatMap(([k, f]) => {
    if (seen.has(f) || get(f) === undefined) return [];
    seen.add(f);
    return [[label(k, f).replace(/^[↑↓←→]\s*|\s*[↑↓←→]$/g, ""), fmt(get(f))]];
  });
}

/** Show an HTML tooltip, with maths, over a live chart drawn with withPointer. */
export function attachTip(el, options, box) {
  const svg = el.matches("svg") ? el : el.querySelector("svg[viewBox]");
  const tip = Object.assign(document.createElement("div"), { className: "posuta-tip", hidden: true });
  box.append(tip);
  const html = (s) => (katex ? tex(katex, s) : esc(s));
  const { ch } = pointerOf(options) ?? {};
  el.addEventListener("input", () => {
    const d = el.value;
    if (!d || !ch) { tip.hidden = true; return; }
    const get = (f) => (typeof f === "function" ? f(d) : d[f]);
    const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const s = svg.getBoundingClientRect(), b = box.getBoundingClientRect();
    tip.innerHTML = tipRows(options, d).map(([l, v]) => `<div><b>${html(l)}</b> ${html(v)}</div>`).join("");
    tip.style.left = `${s.left - b.left + el.scale("x").apply(get(ch.x)) * k}px`;
    tip.style.top = `${s.top - b.top + el.scale("y").apply(get(ch.y)) * k}px`;
    tip.hidden = false;
  });
}
