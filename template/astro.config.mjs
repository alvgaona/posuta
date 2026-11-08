import { defineConfig } from "astro/config";
import posuta from "posuta";

export default defineConfig({ integrations: [posuta()] });
