# Primitives first, components unstyled

Status: done (steps 1–9). Follows the roadmap.

## Why

posuta should let an experienced author build *any* poster, not fill in a fixed one. Today the
package decides how a poster looks: `Poster.astro` hard-codes the header (eyebrow, title,
highlight, lede, two stats) and the footer, components ship with colours, fonts and spacing, and
`posuta pdf` only understands posuta's own markup.

The target:

1. **Tools**: plain functions and a CLI that do the hard parts (print size, PDF export, the overflow
   check, data loading, Plot to SVG, KaTeX, citations, diagram routing). No markup opinions.
2. **Headless components**: thin wrappers over the tools. They output semantic markup with stable
   hooks and the behaviour they need to work, and **no visual styling**. Every one forwards `class`
   and extra attributes.
3. **An opt-in theme**: one stylesheet that gives the hooks a look. The template uses it; nothing
   else depends on it.
4. **The template owns the opinions**: the header, stats, footer and section style move into the
   template as files the author edits, not package components they work around.

A beginner gets the same poster as today from `pnpm create posuta`. An advanced author deletes the
template's layout and builds their own on the same tools, keeping print sizing, PDF export and the
overflow check.

## Rules this plan sets (go into AGENTS.md › Decisions)

- Tools first. A feature lands as a function (or CLI) first; a component, if any, is a thin wrapper.
- Components are unstyled: no colour, font, border or spacing. Only the CSS a component needs to
  *work* (see "Functional CSS"). Styling hooks are `posuta-*` classes, documented as stable API.
- Every component accepts `class` and passes through other attributes.
- Visual design lives in `@posuta/posuta/theme.css` (opt-in) and in the template.
- Unstyled output must still be legible: SVG we generate uses `currentColor` and `fill="none"`
  defaults, never SVG's black-fill defaults.

## Functional vs visual CSS

The split decides almost everything else, so it is spelled out.

**Functional (`@posuta/posuta/base.css`, loaded by `<Canvas>`, in `@layer posuta.base`):**

- The print canvas: `@page` size, the canvas element at paper width × height, `overflow: hidden`,
  print colour adjust. `--paper-w`, `--paper-h`, `--print-scale` custom properties.
- The print type scale: root font size `max(24pt × scale, 12pt)` in print. It is what keeps a
  poster readable, so it is default-on, but it is one layered rule an author can override.
- `<Row>`/`<Col>` mechanics: flex, `--span` weights, wrapping at the two breakpoints, gap from
  `--posuta-gap` (default `2rem`). Reflow is behaviour, not looks.
- Screen/print visibility: `[data-print="only"]` hidden on screen, `[data-print="hide"]` hidden in
  print. Replaces the special cases for the QR code and the slider.
- Live charts: tooltip `position: absolute; pointer-events: none`, `[hidden]` honoured, chart SVGs
  `width: 100%; height: auto`.
- `.posuta-tex` sizing for KaTeX inside SVG.
- KaTeX's own stylesheet (maths does not render without it).

Everything in `@layer posuta.base`, so any author CSS (unlayered) wins with no `!important`.
Exception, kept: rules that must beat Plot's unlayered `<style>` use layered `!important`.

**Visual (`@posuta/posuta/theme.css`, opt-in, in `@layer posuta.theme`):** tokens (light/dark), fonts
(the `@fontsource` imports move here), colours, borders, spacing, the hero/stats/section/footer
looks, diagram colours, tooltip look, references list look.

Lab theme packages keep working: they are unlayered `:root` tokens, read by `theme.css`.

## Steps

Each step ends green: build, all tests, template PDF export.

### 1. Record the decision

Add the rules above to `AGENTS.md › Decisions`; link this plan from the roadmap.

**Done when** both files say it.

### 2. Split the CSS

- `src/base.css`: the functional rules above, taken out of `theme.css`.
- `src/theme.css`: everything else, plus the font imports from `Poster.astro`.
- `.poster` becomes `.posuta-canvas` (the hook `posuta pdf` and base.css use).
- Rename layers: `posuta.base`, `posuta.theme` (theme after base).

**Done when** the template looks the same as before (screenshot compare, light and dark, phone),
and a test page that loads only `base.css` prints at the right size and passes the overflow check.

### 3. Import-free MDX

Authors write `<Section>`, `<Chart>`, `<Row>` with no import lines. A remark plugin in the
integration adds the import for every capitalised JSX name the page uses but does not import or
define itself, looked up in:

1. the poster's `src/components/` (`.astro`, `.jsx`, `.tsx`; file name = component name), then
2. posuta's components (`Canvas`, `Row`, `Col`, `Chart`, `Figure`, `Equation`, `Diagram`, `QR`).

A local component shadows posuta's of the same name; an explicit import always wins.
`<References />` stays handled by the citation plugin. Unknown names are left alone (MDX reports
them as today).

**Done when** the template's `index.mdx` has no imports, a local `src/components/Chart.astro`
shadows posuta's, an explicit import still wins, and a React island with `client:visible` still
hydrates when auto-imported.

### 4. `<Canvas>`, and the layout moves into the template

`@posuta/posuta/Canvas.astro`, the only page-level component:

```astro
<Canvas title="…" description="…" print="A1 landscape" theme={{ accent: "#0a7" }} class="…">
  <slot name="head" />   <!-- extra <head> tags -->
  …anything…
</Canvas>
```

It renders `<html>`, `<head>` (charset, viewport, title, description, Open Graph + `og.png`,
the print CSS from `printCss`, theme tokens / `data-theme`, base.css, KaTeX CSS) and
`<body><div class="posuta-canvas">slot</div></body>`. Nothing visual.

Smaller primitives:

- `@posuta/posuta/QR.astro`: `<QR url={…} />` → inline SVG (defaults to the page URL when `site` is set),
  plus `qrSvg(url)` in `@posuta/posuta/qr` for hand-built markup. No longer placed automatically.

Moves to the template, as user-owned files:

- `template/src/layouts/Poster.astro`: today's header (eyebrow, title, highlight, lede, stats),
  `<main>`, footer and QR placement, built on `<Canvas>`, importing `@posuta/posuta/theme.css`. Reads the
  same frontmatter as today.
- `template/src/components/Section.astro`: today's numbered section.
- `index.mdx`: `layout: ../layouts/Poster.astro`; `Section` comes from `src/components/` through step 3.

Removed from the package: `Poster.astro`, `Section.astro` (no published users yet, so no
deprecation alias).

**Done when** the template looks and prints as today, built only from `Canvas`, `QR`,
`Row`/`Col`, `Chart`, `Equation`, `References` and `theme.css`; `create-posuta` copies the new
files.

### 5. A generic overflow check

`posuta pdf` stops assuming posuta's markup:

- The canvas is `.posuta-canvas`; a page without one fails with "not a posuta page: wrap it in
  `<Canvas>`".
- Candidates: every element in the canvas that has a heading (`h1`–`h4`) as its first element
  child, or a `data-name` attribute. Name = `data-name`, else the heading's text.
- Report each candidate that crosses the bottom or right edge, dropping any that contains another
  reported one (so the message names the innermost block, not its column). If nothing named
  overflows but the canvas does, report the canvas and by how much.

**Done when** tests cover: a hand-built layout with no posuta classes, nested columns (only the
section is named), `data-name`, and the canvas-only fallback.

### 6. Components become headless

For each component: drop visual CSS, forward `class` and attributes, document its hooks.

| Component | Output and hooks | Notes |
| --- | --- | --- |
| `Row`, `Col` | `.posuta-row`, `.posuta-col`, `--span` | mechanics only (base.css) |
| `Chart` | `figure.posuta-chart` › `.posuta-plot`, `figcaption`, `.posuta-slider`, `.posuta-tip` | Plot styles its own SVG; we only set font and background tokens |
| `Figure` | `figure.posuta-figure` › `img`/`svg`, `figcaption` | |
| `Equation` | `.posuta-eq` › KaTeX, `.posuta-eq-n` | |
| `Diagram` | `figure.posuta-diagram` › `svg` with `.box`, `.box-title`, `.box-sub`, `.arrow`, `.arrow-label`, `.group`, `.group-title`, style names as classes | see below |
| `References` | `ol.posuta-refs` › `li#ref-key` | |
| `QR` | `svg.posuta-qr` | |

Diagram, unstyled but legible: boxes `fill="none" stroke="currentColor"`, arrows
`stroke="currentColor"`, arrowheads `fill="context-stroke"`, falling back to one `currentColor`
marker if Chrome's print output disagrees. Class names become readable (`box`, `box-title`,
`box-sub`, `arrow`, `arrow-label`, `group`, `group-title`: not bare `title`/`label`, which collide
with page CSS); the style words (`highlight`, `alert`, `dashed`, `bus`) stay as extra
classes for the theme to colour.

**Done when** every component renders legibly with `base.css` only (screenshot per component),
and the template with `theme.css` looks as before.

### 7. Open up the tools

So an author can go below any component:

- `@posuta/posuta/tex`: `tex(string)` → HTML with `$…$` rendered, and `texSvg(string, x, y, anchor)` →
  SVG (text or `foreignObject`). One implementation; `plot.js` and `diagram.js` use it (today the
  code is duplicated).
- `@posuta/posuta/diagram`: split `renderDiagram` into `layout(spec)` → `{ boxes, groups, arrows, viewBox }`
  (geometry only: points, label anchors) and `draw(layout)` → SVG. `route()` stays exported.
  `<Diagram>` gains a slot: SVG children are drawn on top, in diagram coordinates, so an author can
  annotate without forking.
- `@posuta/posuta/plot`: document the browser side, `plotLive`, `withPointer`, `attachTip`, `mathify`, so a
  custom island gets the same maths and tooltips.
- Citations: `posuta({ citationStyle })` takes a CSL template name (`vancouver` default, `apa`,
  `harvard1`) or a path to a `.csl` file. Export `formatReference(entry, style)`.

**Done when** each export has a test, and the README has a short example of each.

### 8. Proof: a poster built from tools only

A test fixture poster (`packages/posuta/test/fixtures/custom/`), not the template:

- a custom layout on `<Canvas>`, no `theme.css`, its own small stylesheet;
- a full-width banner header, a CSS grid instead of `Row`/`Col`, a hand-drawn SVG that uses
  `route()` and `texSvg()`, a chart, and references.

CI builds it and runs `posuta pdf` on it.

**Done when** it builds and exports, and an overflowing block in it is named correctly.

### 9. Docs

README reorganised by layer: "Start from the template" (today's flow), "Build your own layout"
(Canvas + base.css, the hook list, overriding layers), "Tools" (the function reference).

## Out of scope

- Visual editor, alternate themes beyond the default (labs can publish their own).
- Changing Plot's own output styling beyond font and background.
- Slider generalisation (several controls feeding `state`) unless asked.

## Decisions taken with the user

1. **Hooks**: `posuta-*` classes for parts, plus `class` passthrough on every component. Data
   attributes only for state (`data-print`, `data-interactive`). No per-part class props for now.
2. **Print type scale**: on by default in base.css (body 24 pt at A0, never below 12 pt), one
   layered rule, documented as overridable.
3. **Section** moves to the template; import-free MDX (step 3) keeps authoring as short as today.
4. **Updates**: layout code is copied into each poster and owned by its author; the mechanics that
   need fixes over time stay in `Canvas`, base.css and the tools. Later, only if asked:
   `posuta add <block>` to copy more ready-made blocks (logo strip, author list, other headers).
