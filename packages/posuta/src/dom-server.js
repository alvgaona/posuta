import { parseHTML } from "linkedom";
/** A DOM for Observable Plot at build time. */
export const dom = () => parseHTML("<!doctype html><html><body></body></html>").document;
import katex from "katex";
export { katex };
// Only the browser loads it later; here it is already loaded, so the build sees no dynamic import.
export const loadKatex = async () => katex;
