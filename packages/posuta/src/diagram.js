// Block diagrams from a small spec on a coarse grid, drawn to SVG at build time.
//
//   grid: [40, 70]                       # cell width and row height, px
//   boxes:
//     ctl: { at: [0, 0], w: 4, title: Controller, sub: PID · 100 Hz, style: highlight }
//   groups:
//     - { title: Companion computer, boxes: [ctl, …], titleAt: bottom }
//   arrows:
//     - ctl -> plant                    # or { from, to, label, style, route: over|under, x, side: left }
//
// Box styles: highlight, dashed, bus. Arrow styles: highlight, alert, dashed (combine with spaces).
// Labels may hold $math$ (KaTeX).
//
// Unstyled it draws in currentColor with no fill. Hooks for CSS: .box, .box-title, .box-sub, .arrow,
// .arrow-label, .group, .group-title, plus each style word as a class (.highlight, .alert…).
// Arrowheads take their arrow's stroke colour.
import katex from "katex";
import { parse as parseYaml } from "yaml";

const ROUTE_GAP = 22; // how far an over/under route clears the boxes, px
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const words = (style) => (style ? String(style).split(/\s+/) : []);
const cls = (base, style) => [base, ...words(style)].join(" ");
// Unstyled defaults as presentation attributes: any CSS overrides them.
const LINE = `fill="none" stroke="currentColor"`;
const dash = (style) => (words(style).includes("dashed") ? ` stroke-dasharray="5 3"` : "");
const SIZE = { "box-title": 14, "box-sub": 11.5, "arrow-label": 11.5, "group-title": 11 };

function hash(s) {
  let h = 0;
  for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}

/** A label: SVG text, or KaTeX in a foreignObject when it has $math$. */
function label(text, x, y, anchor, klass) {
  if (!/\$[^$]+\$/.test(text)) {
    const size = SIZE[klass.split(" ")[0]];
    return `<text class="${klass}" x="${x}" y="${y}" text-anchor="${anchor}" fill="currentColor" font-size="${size}">${esc(text)}</text>`;
  }
  const html = String(text).split(/(\$[^$]+\$)/).map((part) =>
    part.startsWith("$") && part.endsWith("$") && part.length > 2
      ? katex.renderToString(part.slice(1, -1), { throwOnError: true, strict: "error" })
      : esc(part)).join("");
  const w = 240, h = 26;
  const fx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const justify = anchor === "middle" ? "center" : anchor === "end" ? "flex-end" : "flex-start";
  return `<foreignObject x="${fx}" y="${y - h + 6}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="${klass}" style="justify-content:${justify}">${html}</div></foreignObject>`;
}

/** Parse "a -> b" shorthand. */
function arrowOf(a) {
  if (a && typeof a === "object" && !a.from) {
    // YAML reads `a -> b: label` as the one-key map { "a -> b": "label" }.
    const keys = Object.keys(a);
    if (keys.length === 1 && keys[0].includes("->")) a = `${keys[0]}: ${a[keys[0]]}`;
  }
  if (typeof a !== "string") return a;
  const m = /^\s*([\w-]+)\s*->\s*([\w-]+)\s*(?::\s*(.+))?$/.exec(a);
  if (!m) throw new Error(`posuta <Diagram>: cannot read arrow "${a}"; write "from -> to" or "from -> to: label"`);
  return { from: m[1], to: m[2], label: m[3] };
}

/**
 * Route an orthogonal arrow from box a to box b.
 * @returns {{ pts: number[][], seg: number }} polyline points and the index of the segment to label
 */
export function route(a, b, { route: via, x, pos = 0.5 } = {}) {
  const cx = (r) => r.x + r.w / 2, cy = (r) => r.y + r.h / 2;
  if (via === "over" || via === "under") {
    const up = via === "over";
    const y = up ? Math.min(a.y, b.y) - ROUTE_GAP : Math.max(a.y + a.h, b.y + b.h) + ROUTE_GAP;
    const ay = up ? a.y : a.y + a.h, by = up ? b.y : b.y + b.h;
    return { pts: [[cx(a), ay], [cx(a), y], [cx(b), y], [cx(b), by]], seg: 1 };
  }
  const xo = [Math.max(a.x, b.x), Math.min(a.x + a.w, b.x + b.w)]; // shared x range
  const yo = [Math.max(a.y, b.y), Math.min(a.y + a.h, b.y + b.h)]; // shared y range
  if (xo[1] - xo[0] > 8 && (b.y >= a.y + a.h || a.y >= b.y + b.h)) {
    const px = x ?? xo[0] + (xo[1] - xo[0]) * pos;
    const down = b.y >= a.y + a.h;
    return { pts: [[px, down ? a.y + a.h : a.y], [px, down ? b.y : b.y + b.h]], seg: 0 };
  }
  if (yo[1] - yo[0] > 8) {
    const py = yo[0] + (yo[1] - yo[0]) * pos;
    const right = b.x >= a.x + a.w;
    return { pts: [[right ? a.x + a.w : a.x, py], [right ? b.x : b.x + b.w, py]], seg: 0 };
  }
  // No shared range: an elbow, leaving vertically if the boxes are further apart that way.
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  if (dy >= dx) {
    const down = b.y > a.y;
    const y0 = down ? a.y + a.h : a.y, y1 = down ? b.y : b.y + b.h, ym = (y0 + y1) / 2;
    return { pts: [[cx(a), y0], [cx(a), ym], [cx(b), ym], [cx(b), y1]], seg: 1 };
  }
  const right = b.x > a.x;
  const x0 = right ? a.x + a.w : a.x, x1 = right ? b.x : b.x + b.w, xm = (x0 + x1) / 2;
  return { pts: [[x0, cy(a)], [xm, cy(a)], [xm, cy(b)], [x1, cy(b)]], seg: 1 };
}

/** Spec (object or YAML text) → SVG markup. */
export function renderDiagram(input) {
  const spec = typeof input === "string" ? parseYaml(input) : input;
  const [cw, rh] = spec.grid ?? [40, 70];
  const id = "pd" + hash(JSON.stringify(spec));
  const boxes = new Map();
  for (const [name, b] of Object.entries(spec.boxes ?? {})) {
    if (!Array.isArray(b.at)) throw new Error(`posuta <Diagram>: box "${name}" needs at: [col, row]`);
    boxes.set(name, { ...b, x: b.at[0] * cw, y: b.at[1] * rh, w: (b.w ?? 3) * cw, h: (b.h ?? 0.8) * rh });
  }
  const box = (n) => {
    if (!boxes.has(n)) throw new Error(`posuta <Diagram>: no box named "${n}"`);
    return boxes.get(n);
  };
  const out = [];
  const ext = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x, y) => { ext.x0 = Math.min(ext.x0, x); ext.y0 = Math.min(ext.y0, y); ext.x1 = Math.max(ext.x1, x); ext.y1 = Math.max(ext.y1, y); };

  // Arrows between the same two boxes share the overlap evenly instead of stacking.
  const arrows = (spec.arrows ?? []).map(arrowOf);
  const pairKey = (a) => [a.from, a.to].sort().join("\u0000");
  const pairs = new Map();
  for (const a of arrows) if (!a.route && a.x == null) pairs.set(pairKey(a), (pairs.get(pairKey(a)) ?? 0) + 1);
  const seen = new Map();
  const drawn = arrows.map((a) => {
    const k = pairKey(a), n = pairs.get(k) ?? 1, i = seen.get(k) ?? 0;
    if (!a.route && a.x == null) seen.set(k, i + 1);
    const { pts, seg } = route(box(a.from), box(a.to), { ...a, x: a.x != null ? a.x * cw : undefined, pos: (i + 1) / (n + 1) });
    const style = String(a.style ?? "");
    const svg = [`<path class="${cls("arrow", a.style)}" d="M${pts.map((p) => p.join(",")).join(" L")}" ${LINE}${dash(a.style)} marker-end="url(#${id}-ah)"/>`];
    const marks = [...pts];
    if (a.label) {
      const [[x0, y0], [x1, y1]] = [pts[seg], pts[seg + 1]];
      const lk = cls("arrow-label", words(style).includes("alert") ? "alert" : "");
      if (y0 === y1) {
        svg.push(label(a.label, (x0 + x1) / 2, y0 - 7, "middle", lk));
        marks.push([(x0 + x1) / 2, y0 - 19]);
      } else {
        const left = a.side === "left";
        svg.push(label(a.label, x0 + (left ? -7 : 7), (y0 + y1) / 2 + 4, left ? "end" : "start", lk));
      }
    }
    return { a, svg: svg.join(""), marks };
  });

  // A group wraps its boxes and the arrows that run between them, with room for its title.
  for (const g of spec.groups ?? []) {
    const inside = new Set(g.boxes);
    const xs = [], ys = [];
    for (const b of g.boxes.map(box)) xs.push(b.x, b.x + b.w), ys.push(b.y, b.y + b.h);
    for (const d of drawn) if (inside.has(d.a.from) && inside.has(d.a.to)) d.marks.forEach(([x, y]) => (xs.push(x), ys.push(y)));
    const bottom = g.titleAt === "bottom";
    const x = Math.min(...xs) - 14, x1 = Math.max(...xs) + 14;
    const y = Math.min(...ys) - (bottom ? 14 : 34), y1 = Math.max(...ys) + (bottom ? 34 : 14);
    out.push(`<rect class="${cls("group", g.style)}" x="${x}" y="${y}" width="${x1 - x}" height="${y1 - y}" rx="10" ${LINE} stroke-dasharray="5 4"/>`);
    if (g.title) out.push(bottom
      ? label(g.title, x1 - 12, y1 - 11, "end", "group-title")
      : label(g.title, x + 12, y + 21, "start", "group-title"));
    grow(x, y); grow(x1, y1);
  }

  for (const b of boxes.values()) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    out.push(`<rect class="${cls("box", b.style)}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" ${LINE}${dash(b.style)}/>`);
    if (b.sub) out.push(label(b.title ?? "", cx, cy - 3, "middle", "box-title"), label(b.sub, cx, cy + 15, "middle", "box-sub"));
    else out.push(label(b.title ?? "", cx, cy + 5, "middle", words(b.style).includes("bus") ? "box-sub" : "box-title"));
    grow(b.x, b.y); grow(b.x + b.w, b.y + b.h);
  }

  for (const d of drawn) {
    out.push(d.svg);
    d.marks.forEach(([x, y]) => grow(x, y));
  }

  const m = 8;
  const [vx, vy, vw, vh] = [ext.x0 - m, ext.y0 - m, ext.x1 - ext.x0 + 2 * m, ext.y1 - ext.y0 + 2 * m];
  // context-stroke: the head takes the colour of the arrow that uses it.
  const marker = `<marker id="${id}-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="context-stroke"/></marker>`;
  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}"><defs>${marker}</defs>${out.join("")}</svg>`;
}
