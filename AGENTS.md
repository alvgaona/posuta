# AGENTS.md — posuta

posuta builds research posters that work as web pages and as printed posters from one source.
Researchers write MDX; the output is a static site for any free host plus a vector PDF at any size.
It grew out of two hand-written HTML posters (ft-tilt, dq-formation) that were hard to read and edit.

## Repo
pnpm workspace. `packages/posuta` (Astro integration, components, theme) and `template` (the
starter poster that `create-posuta` copies; `pnpm dev` / `pnpm build` run it). Project posters
(ft-tilt, dq-formation) live in their own repos, not here.

## Decisions (agreed; change them only with the user)
- **Astro**, static output only, so any static host works (Pages, Cloudflare, Netlify, Vercel).
  Don't depend on one host. No server, no accounts.
- **Authoring: MDX + frontmatter.** Frontmatter holds title, authors, stats, print size, theme;
  the body holds `<Section>` and other components. A researcher must be able to edit text without
  touching HTML.
- **Plots: Observable Plot**, rendered to SVG at build time (prints as vectors, works without JS),
  made interactive in the browser where needed. Matplotlib SVGs are accepted through `<Figure>`.
  Other chart libraries may live in islands, but each must define a static frame for print.
- **Math: KaTeX at build time.**
- **Islands: React** for interactive figures.
- **Tools first, components unstyled.** Any author must be able to build any poster. A feature
  lands as a function or CLI first; a component, if any, is a thin wrapper. Components output
  semantic markup with `posuta-*` class hooks, accept `class`, and carry no colour, font, border
  or spacing: only the CSS they need to work (`base.css`). The look lives in the opt-in
  `posuta/theme.css` and in the template, whose layout and sections the author owns.
- **Unstyled must stay legible**: generated SVG defaults to `currentColor` and no fill.
- **MDX without imports**: posuta's components and the poster's `src/components/` are available
  in MDX without import lines.

## Plan
The roadmap, with what "done" means for each step, is in `.agents/plans/roadmap.md`. The move to
tools and unstyled components is planned in `.agents/plans/primitives.md`.

## Rules
- Conventional Commits, `type(scope): subject`.
- Keep the theme as CSS custom properties on `:root`, light and dark.
- Every component must render without client JS, and must look right in print.
