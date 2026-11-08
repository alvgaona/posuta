import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import posuta from "posuta";

// An author's own rehype plugin, run after posuta's: marks every <h2> it sees.
const markHeadings = () => (tree) => {
  const walk = (n) => { if (n.tagName === "h2") n.properties["data-plugin"] = ""; n.children?.forEach(walk); };
  walk(tree);
};

export default defineConfig({
  integrations: [posuta({ citationStyle: "apa", rehypePlugins: [markHeadings] })],
  vite: { plugins: [tailwindcss()] }, // used by the /tailwind/ page only
});
