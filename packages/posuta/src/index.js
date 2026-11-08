import { fileURLToPath } from "node:url";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkAutoImport from "./remark-auto-import.js";
import remarkCite from "./remark-cite.js";

/**
 * posuta's Astro integration: one line in astro.config, and posters are MDX pages with math,
 * citations, and components available without import lines. React islands (for PlotFigure) need `astro add react`.
 * @param {{ theme?: string, citationStyle?: string, remarkPlugins?: any[], rehypePlugins?: any[] }} [options]
 *   theme: a CSS file or package of :root tokens, e.g. "@my-lab/posuta-theme"
 *   citationStyle: vancouver (default), apa, harvard1, or a .csl file relative to the project root
 *   remarkPlugins, rehypePlugins: yours, run after posuta's (e.g. rehype-mermaid for diagrams)
 * @returns {import("astro").AstroIntegration}
 */
export default function posuta({ theme, citationStyle = "vancouver", remarkPlugins = [], rehypePlugins = [] } = {}) {
  return {
    name: "posuta",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript, logger }) => {
        // posuta's CSS is layered (posuta.base, posuta.theme), so these unlayered tokens win whatever the order.
        if (theme) injectScript("page-ssr", `import ${JSON.stringify(theme)};`);
        globalThis.__posutaRoot = fileURLToPath(config.root); // data/ lives here (see data.js)
        const has = (name) => config.integrations.some((i) => i.name === name);
        const integrations = [];
        if (!has("@astrojs/mdx")) integrations.push(mdx());
        const markdown = {};
        if (config.markdown.processor?.name !== "satteri") logger.warn("markdown.processor is set; add remark-math, rehype-katex and posuta's remark-cite and remark-auto-import to it yourself");
        else {
          const components = fileURLToPath(new URL("components/", config.srcDir));
          const style = citationStyle.endsWith(".csl") ? fileURLToPath(new URL(citationStyle, config.root)) : citationStyle;
          markdown.processor = unified({
            remarkPlugins: [remarkMath, [remarkCite, { style }], [remarkAutoImport, { components }], ...remarkPlugins],
            rehypePlugins: [rehypeKatex, ...rehypePlugins],
          });
        }
        updateConfig({ integrations, markdown });
      },
    },
  };
}
