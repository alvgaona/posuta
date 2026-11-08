import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import posuta from "posuta";

export default defineConfig({
  integrations: [posuta({ citationStyle: "apa" })],
  vite: { plugins: [tailwindcss()] }, // used by the /tailwind/ page only
});
