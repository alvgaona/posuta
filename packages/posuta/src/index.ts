import mdx from "@astrojs/mdx";
import type { AstroIntegration } from "astro";

/** posuta's Astro integration: one line in astro.config, and posters are MDX pages. */
export default function posuta(): AstroIntegration {
  return {
    name: "posuta",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        if (!config.integrations.some((i) => i.name === "@astrojs/mdx")) {
          updateConfig({ integrations: [mdx()] });
        }
      },
    },
  };
}
