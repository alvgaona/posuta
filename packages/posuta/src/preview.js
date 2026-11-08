// Print preview in the browser (astro dev, any page URL + ?print): the print CSS applies on
// screen, the canvas is laid out at the paper size, checked for overflow like posuta pdf, and
// scaled to fit the window. Overflowing blocks get a red outline; a banner lists them.
// shortcut: media queries on width alone (no print/screen) still follow the window, not the paper.
import { overflow } from "./overflow.js";

const done = new WeakSet();

/** Flip the media rules: print ones apply, screen ones don't, and colours are light, as in the PDF. */
function flip(rules) {
  for (const r of rules) {
    if (r.media && r.type === CSSRule.MEDIA_RULE && !done.has(r)) {
      done.add(r);
      r.media.mediaText = r.media.mediaText
        .replace(/\b(print|screen)\b/g, (m) => (m === "print" ? "all" : "print")) // "print" never matches on screen
        .replace(/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g, "(max-width: 0px)")
        .replace(/\(\s*prefers-color-scheme\s*:\s*light\s*\)/g, "(min-width: 0px)");
    }
    if (r.styleSheet) flip(safe(r.styleSheet)); // @import
    if (r.cssRules) flip(r.cssRules); // @layer, @supports, nested @media
  }
}
const safe = (sheet) => { try { return sheet.cssRules; } catch { return []; } }; // cross-origin sheets can't be read

let banner;
function apply() {
  for (const s of document.styleSheets) flip(safe(s));
  const canvas = document.querySelector(".posuta-canvas");
  if (!canvas) return;
  canvas.style.transform = "";
  document.querySelectorAll("[data-posuta-overflow]").forEach((el) => el.removeAttribute("data-posuta-overflow"));
  const problems = overflow(true);
  const css = getComputedStyle(document.documentElement);
  const size = `${css.getPropertyValue("--paper-w").trim()} × ${css.getPropertyValue("--paper-h").trim()}`;
  banner ??= document.body.appendChild(Object.assign(document.createElement("div"), { className: "posuta-preview-banner" }));
  banner.dataset.ok = String(!problems.length);
  banner.textContent = problems.length ? `Does not fit on ${size}:\n${problems.join("\n")}` : `Print preview: fits on ${size}`;
  fit();
}

function fit() {
  const canvas = document.querySelector(".posuta-canvas");
  if (!canvas) return;
  const s = Math.min(innerWidth / canvas.offsetWidth, innerHeight / canvas.offsetHeight, 1);
  canvas.style.transformOrigin = "0 0";
  canvas.style.transform = `scale(${s})`;
}

export function preview() {
  document.head.appendChild(document.createElement("style")).textContent =
    "html,body{overflow:hidden}[data-posuta-overflow]{outline:4px solid #e00;outline-offset:-2px}" +
    ".posuta-preview-banner{position:fixed;right:8px;bottom:8px;z-index:2147483647;max-width:40em;padding:6px 10px;" +
    "font:13px/1.4 system-ui,sans-serif;white-space:pre-line;color:#fff;background:#c00;border-radius:4px}" +
    ".posuta-preview-banner[data-ok=true]{background:#286}";
  const run = () => document.fonts.ready.then(apply);
  run();
  addEventListener("load", run);
  addEventListener("resize", fit);
  import.meta.hot?.on("vite:afterUpdate", run);
}
