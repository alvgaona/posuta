// Paper sizes and the print scale. Plain JS so the layout (at build) and the CLI share it.

/** Portrait sizes in mm. */
export const PAPER = {
  A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420],
  "24x36in": [609.6, 914.4], "36x48in": [914.4, 1219.2], "42x56in": [1066.8, 1422.4], "48x72in": [1219.2, 1828.8],
};
const UNIT = { mm: 1, cm: 10, in: 25.4 };
const A0_AREA = 841 * 1189;

function mm(v) {
  const m = /^\s*([\d.]+)\s*(mm|cm|in)\s*$/.exec(String(v));
  if (!m) throw new Error(`posuta: print size "${v}" needs a number and a unit (mm, cm or in)`);
  return +m[1] * UNIT[m[2]];
}

/**
 * Frontmatter `print` → paper in mm, the type scale, and `text`, the author's own factor on it.
 * Accepts "A1", "A1 landscape", { size, orientation } or { width: "900mm", height: "36in" };
 * the object forms take `scale` too, e.g. { size: "A0", scale: 0.8 } for smaller text.
 */
export function paper(print = "A0") {
  const p = typeof print === "string" ? { size: print.split(/[\s:]+/)[0], orientation: print.split(/[\s:]+/)[1] } : print;
  let w, h;
  if (p.width != null || p.height != null) {
    if (p.width == null || p.height == null) throw new Error("posuta: a custom print size needs both width and height");
    [w, h] = [mm(p.width), mm(p.height)];
  } else {
    const size = PAPER[p.size ?? "A0"];
    if (!size) throw new Error(`posuta: unknown print size "${p.size}"; use one of ${Object.keys(PAPER).join(", ")} or { width, height }`);
    [w, h] = size;
  }
  if (p.orientation && !["portrait", "landscape"].includes(p.orientation)) {
    throw new Error(`posuta: orientation must be portrait or landscape, not "${p.orientation}"`);
  }
  if ((p.orientation === "landscape" && w < h) || (p.orientation === "portrait" && w > h)) [w, h] = [h, w];
  const text = p.scale ?? 1;
  if (!(typeof text === "number" && text > 0)) throw new Error(`posuta: print scale must be a number above 0, not "${p.scale}"`);
  // Type follows the paper's area, so a sheet reads the same in either orientation.
  return { width: w, height: h, scale: Math.sqrt((w * h) / A0_AREA), text };
}

/** The CSS that sets the page box and the scale; the theme reads the custom properties. */
export function printCss(print) {
  const { width, height, scale, text } = paper(print);
  return `@page{size:${width}mm ${height}mm;margin:0}` +
    `:root{--paper-w:${width}mm;--paper-h:${height}mm;--print-scale:${scale.toFixed(4)};--print-text:${text}}`;
}
