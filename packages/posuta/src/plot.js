// Observable Plot → SVG markup, with posuta's defaults (theme font, transparent background).
import * as Plot from "@observablehq/plot";
import { dom } from "#dom";

/** Plot options with the theme defaults filled in. */
export function withDefaults(options) {
  return {
    ...options,
    style: { background: "transparent", fontFamily: "var(--font-body)", ...options.style },
  };
}

/** Render to an element (live in the browser). */
export const plot = (options) => Plot.plot({ ...withDefaults(options), document: dom() });

/** Render to markup; works at build time, with no browser. */
export const renderPlot = (options) => plot(options).outerHTML;

export { Plot };
