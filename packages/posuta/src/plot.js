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
