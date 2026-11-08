// $…$ in plain text → KaTeX: as HTML (tex) or as an SVG label (texSvg). Charts and hand-drawn
// SVG use these. At build time KaTeX is built in; in the browser pass it in:
//   tex("$\\omega_n$", (await import("katex")).default)
import { katex as builtIn } from "#dom";

export const MATH = /\$[^$]+\$/;
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Text with $…$ → HTML: the maths rendered with KaTeX, the rest escaped. */
export function tex(s, katex = builtIn) {
  if (!katex) throw new Error('posuta tex: in the browser, pass KaTeX: tex(s, (await import("katex")).default)');
  return String(s).split(/(\$[^$]+\$)/).map((p) => (p.length > 2 && p.startsWith("$") && p.endsWith("$")
    ? katex.renderToString(p.slice(1, -1), { throwOnError: true, output: "html" }) : esc(p))).join("");
}

/**
 * An SVG label with its baseline at (x, y): a <text> for plain text, or KaTeX in a foreignObject
 * when it holds $…$ (the maths takes the SVG's font size and colour).
 * @param {{ anchor?: "start" | "middle" | "end", class?: string, size?: number, katex?: any }} [o]
 */
export function texSvg(s, x, y, { anchor = "start", class: cls, size, katex } = {}) {
  const c = cls ? ` class="${esc(cls)}"` : "";
  if (!MATH.test(s)) {
    return `<text${c} x="${x}" y="${y}" text-anchor="${anchor}" fill="currentColor"${size ? ` font-size="${size}"` : ""}>${esc(s)}</text>`;
  }
  const tx = { start: "0", middle: "-50%", end: "-100%" }[anchor] ?? "0";
  return `<foreignObject x="${x}" y="${y}" width="1" height="1" overflow="visible"><div xmlns="http://www.w3.org/1999/xhtml"` +
    ` class="posuta-tex${cls ? " " + esc(cls) : ""}" style="transform:translate(${tx},-80%)">${tex(s, katex)}</div></foreignObject>`;
}
