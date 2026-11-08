import { fileURLToPath } from "node:url";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkCite from "./remark-cite.js";

/**
 * posuta's Astro integration: one line in astro.config, and posters are MDX pages with math
 * and citations. React islands (for PlotFigure) need `astro add react`.
 * @param {{ theme?: string }} [options] theme: a CSS file or package of :root tokens, e.g. "@my-lab/posuta-theme"
 * @returns {import("astro").AstroIntegration}
 */
export default function posuta({ theme } = {}) {
  return {
    name: "posuta",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript, logger }) => {
        // The default theme is in @layer posuta, so these unlayered tokens win whatever the order.
        if (theme) injectScript("page-ssr", `import ${JSON.stringify(theme)};`);
        globalThis.__posutaRoot = fileURLToPath(config.root); // data/ lives here (see data.js)
        const has = (name) => config.integrations.some((i) => i.name === name);
        const integrations = [];
        if (!has("@astrojs/mdx")) integrations.push(mdx());
        const markdown = {};
        if (config.markdown.processor?.name !== "satteri") logger.warn("markdown.processor is set; add remark-math, rehype-katex and posuta's remark-cite to it yourself");
        else markdown.processor = unified({ remarkPlugins: [remarkMath, remarkCite], rehypePlugins: [rehypeKatex] });
        updateConfig({ integrations, markdown });
      },
    },
  };
}
