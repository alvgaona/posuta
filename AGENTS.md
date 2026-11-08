# AGENTS.md — posuta

## Vision
A research poster should be as easy to write, read and share as a paper, and should not be
thrown away after the conference. One source becomes both a web page anyone can open and a
printed poster that fills the board, with nothing lost between the two.

## Mission
posuta is the framework that turns one MDX file into a static website and a vector PDF at any
paper size. A researcher writes text, numbers, plots, maths and citations without touching HTML.
A designer reshapes it into any poster without fighting the framework. It runs on any free
static host, with no server, no accounts and no lock-in.

posuta grew out of two hand-written HTML posters (ft-tilt, dq-formation) that were hard to read
and edit. Every decision below serves the vision above. When one doesn't, raise it with the user.

## Principles
- **One source, two outputs.** Every feature must work on the web and in print. A feature that
  can't print defines a static frame that does.
- **Print never fails silently.** Content that runs past the page fails the export and names
  the block. Vectors, embedded fonts, exact paper size.
- **Text first.** Editing the poster's words must never require HTML.
- **Tools first, components unstyled.** posuta ships capabilities, the author owns the look.
- **Static and portable.** Build-time rendering over client JS. Any static host.

## Repo
pnpm workspace.
- `packages/posuta`, published as `@posuta/posuta`. Astro integration, components, CLI
  (`posuta pdf`, `posuta install`), theme hooks.
- `packages/create-posuta`, the `pnpm create posuta` starter. It copies `template`.
- `template`, the starter poster. `pnpm dev` and `pnpm build` run it.
- `apps/web`, the Fumadocs docs site on Astro. `pnpm docs` runs it.

Project posters (ft-tilt, dq-formation) live in their own repos, not here.

## Decisions (agreed; change them only with the user)
- **Astro, static output only**, so any static host works (Pages, Cloudflare, Netlify, Vercel).
  Don't depend on one host. No server, no accounts.
- **Authoring: MDX + frontmatter.** Frontmatter holds title, authors, stats, print size, theme.
  The body holds `<Section>` and other components.
- **MDX without imports.** posuta's components and the poster's `src/components/` are available
  in MDX without import lines.
- **Plots: Observable Plot**, rendered to SVG at build time (prints as vectors, works without JS),
  made interactive in the browser where needed. Matplotlib SVGs come in through `<Figure>`.
  Other chart libraries may live in islands, but each must define a static frame for print.
- **Math: KaTeX at build time.**
- **Interactivity without a framework.** Chart files (`interactive`, `slider`) redraw in the
  browser with plain JS. Authors may add any Astro island, built on `@posuta/posuta/plot`.
- **Tools first, components unstyled.** A feature lands as a function or CLI first. A component,
  if any, is a thin wrapper. Components output semantic markup with `posuta-*` class hooks,
  accept `class`, and carry no colour, font, border or spacing, only the CSS they need to work
  (`base.css`). The look lives in the template (`src/styles/theme.css`, the layout and
  sections), which the author owns.
- **Unstyled must stay legible.** Generated SVG defaults to `currentColor` and no fill.
- **Parts, Base UI style.** A component with inner structure also comes as parts
  (`Figure.Root`, `Figure.Media`, `Figure.Caption`) the author arranges in any markup. The
  one-line form (`<Figure src alt caption />`) is a preset built from them. Parts take `class`,
  attributes, and `as` where the element can vary.
- **Tailwind and plain CSS both work.** `<Canvas>` declares the layer order
  `theme, base, posuta.base, posuta.theme, components, utilities`. Unlayered CSS beats all.
- **No diagram builder in posuta.** Diagrams come from outside tools as SVG through `<Figure>`,
  or through the author's own remark/rehype plugins (`posuta({ rehypePlugins })`).
- **Docs: Fumadocs on Astro** (`apps/web`), static like everything else, so the docs can render
  real posuta components. `@fumadocs/astro` is 0.x, keep it pinned to an exact version.
  `apps/web` pins `astro` to 7.4.6. 7.4.7 moved to Sätteri 0.11 while `@fumadocs/astro` 0.2.1 is
  on 0.10, and the mismatch drops code highlighting and boxes every block twice. Unpin once
  `@fumadocs/astro` moves to Sätteri 0.11.

## Plans
Plans live in `.agents/plans/` and are not tracked in git. `roadmap.md` holds the roadmap and
what "done" means for each step. `primitives.md` covers the move to tools and unstyled components.

## Rules
- Conventional Commits, `type(scope): subject`.
- Keep the theme as CSS custom properties on `:root`, light and dark.
- Every component must render without client JS, and must look right in print.
- Documentation prose (docs, READMEs, site copy) has no semicolons, no colons and no inline code
  with parentheses. Write `qrSvg`, not `qrSvg()`. Split the sentence, or end it with a full stop
  before a list or code block. Code, frontmatter keys and component props are exempt.
