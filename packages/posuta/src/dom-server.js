import { parseHTML } from "linkedom";
/** A DOM for Observable Plot at build time. */
export const dom = () => parseHTML("<!doctype html><html><body></body></html>").document;
export { default as katex } from "katex";
