/** In the browser Plot draws into the page's own document. */
export const dom = () => document;
/** KaTeX loads on demand in the browser (see plotLive), so pages without chart math skip it. */
export const katex = null;
