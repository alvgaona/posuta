import mdx from "@astrojs/mdx";

/**
 * posuta's Astro integration: one line in astro.config, and posters are MDX pages.
 * @returns {import("astro").AstroIntegration}
 */
export default function posuta() {
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
