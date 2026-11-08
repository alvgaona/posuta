# posuta roadmap

Status: steps 0–4 done, except publishing to npm (packages are ready; needs a maintainer to run it).
Next: tools first and unstyled components, in `primitives.md`.
Steps run in order: each one sets rules the next ones build on. Decisions behind this plan are in
`AGENTS.md`.

## 0. Repo hygiene

- First commit.
- commitlint (Conventional Commits, `type(scope): subject`) in a lefthook `commit-msg` hook and in
  CI, as in ft-tilt.
- CI: install, build `template/`.

**Done when** a bad commit message is rejected locally and in CI, and CI builds the template.

## 1. Layout and print canvas

Everything else has to fit inside these, so they come first.

- `<Row>` / `<Col span>`: explicit grid. On screen it reflows by width (three columns → two →
  one); in print it keeps the grid as written.
- `print` in frontmatter: presets (`A0`, `A1`, `A2`, `36x48in`, …), `orientation`, or custom
  size in mm or in.
- One reference size (A0). Type and spacing scale from it to the chosen paper. A minimum body
  size keeps print readable at about a metre (≈ 24 pt at A0).
- `posuta pdf`: Playwright, vector output, embedded fonts, one page at the exact paper size.
- Overflow check: the export fails, naming the section, if content runs past the canvas.
  Silently cut content is the worst failure for a printed poster.

**Done when** the template exports cleanly at A0 and A1 in both orientations, reflows to one
column on a phone, and an overflowing section fails the export with a clear message.

## 2. Content components

- `<Chart>`: an Observable Plot spec, rendered to SVG at build time; optional interactivity in
  the browser. Interactive charts declare the state they print in.
- Math: inline `$…$` and `<Equation>`, KaTeX at build time, fonts bundled.
- `<Figure>`: images and matplotlib SVGs; alt text required. Ship a matplotlib style file that
  matches the theme's fonts and colours.
- Citations: `bibliography:` in frontmatter, `[@key]` in text, numbered in order of first
  citation, references block with DOI links (citation-js).
- Data: files in `data/` (CSV, JSON, Parquet), loaded at build, long series downsampled.

**Done when** the template shows a line chart from a CSV, a few equations and a numbered
reference list, all rendered with JavaScript off and sharp in the PDF.

## 3. Diagrams

The most original part and the riskiest, so it gets its own prototype.

- A small spec on a coarse grid: named boxes (`at: [col, row]`, title, subtitle, style),
  arrows between names with automatic orthogonal routing, labels with math, lanes/groups,
  a highlighted style and a dashed one.
- Rendered to SVG at build time; follows the theme, light and dark.
- `<Figure>` still accepts SVG from Excalidraw, draw.io and similar.

**Done when** the ft-tilt architecture diagram can be redrawn from a spec of about 40 lines
(in a scratch poster outside this repo) and looks as good as the hand-placed SVG.

## 4. Shipping

- `create-posuta`: copies `template/`, asks title and print size.
- GitHub Actions workflow in the template: build, deploy to Pages, attach the PDF.
- "Open in StackBlitz" / Codespaces button for editing with nothing installed.
- QR code to the live page, placed on the printed poster.
- PNG preview for social sharing.
- Theme packages: tokens only (`:root` custom properties), so a lab can publish its branding.
- Publish `posuta` and `create-posuta` to npm.

**Done when** `pnpm create posuta`, edit, push gives a live page and a PDF with no other setup.

## Later, only if asked for

- A visual web editor (would need a server, accounts and storage).
- Sharing theme, math and citation packages with suraido.
