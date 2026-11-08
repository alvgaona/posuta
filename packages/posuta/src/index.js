import { fileURLToPath } from "node:url";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkCite from "./remark-cite.js";

/**
 * posuta's Astro integration: one line in astro.config, and posters are MDX pages with math
 * and citations. React islands (for PlotFigure) need `astro add react`.
 * @returns {import("astro").AstroIntegration}
 */
export default function posuta() {
  return {
    name: "posuta",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, logger }) => {
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
