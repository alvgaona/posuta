# posuta

Research posters for the web and for print. ポスター (*posutā*), "poster"; the poster sibling of
suraido (slides).

Write a poster in MDX, deploy it as a static site on any free host, and export a vector PDF at
whatever size the conference asks for.

posuta comes in three layers, and you can stop at any of them:

1. **The template**: a finished poster to fill in. Its layout and section style are files in your
   project, yours to change.
2. **Your own layout**: `<Canvas>` gives you the print page, the PDF export and the overflow
   check; everything inside it is your markup and your CSS. posuta's components are unstyled.
3. **Tools**: the functions under the components (Plot to SVG, KaTeX, diagram routing,
   citations, data loading), for drawing anything the components don't.


## Start a poster

```sh
pnpm create posuta my-poster
cd my-poster && pnpm install && pnpm dev
```

Push it to GitHub and turn on Pages (Settings → Pages → Source: GitHub Actions): every push
publishes the page and `poster.pdf` next to it. The template also has Open in StackBlitz /
Codespaces buttons for editing with nothing installed.

## Work on posuta

```sh
pnpm install
pnpm dev     # the starter poster in template/ at http://localhost:4321
pnpm build   # static site in template/dist
pnpm pdf     # build, then template/dist/poster.pdf at the paper size
pnpm test
```

`posuta pdf` uses Playwright's Chromium; install it once with `pnpm exec posuta install`.


## 1. Start from the template

A poster is one MDX page. posuta's components and your own (`src/components/`) work without
import lines.

```mdx
---
layout: ../layouts/Poster.astro
title: A Hexacopter That Keeps Flying After Losing a Motor,
highlight: with Rotors Tilted 17° Inward
lede: One paragraph that says what the poster shows.
stats:
  - { value: "≤ 1.5°", label: "tilt with any one motor off", accent: true }
---

<Section n={1} title="The problem">

Plain **Markdown** here.

</Section>
```

`astro.config.mjs` needs one line: `integrations: [posuta()]`.

The header, stats, footer and QR code are in `src/layouts/Poster.astro`; the numbered section is
`src/components/Section.astro`. Edit them like any other file in your project. The look comes from
`posuta/theme.css`, which the layout imports.

### Columns

```mdx
<Row>
<Col>…</Col>
<Col span={2}>…twice as wide…</Col>
</Row>
```

On screen a row reflows by width (three columns, then two, then one on a phone). In print it keeps
the columns as written.

When blocks should line up across rows, or one block should span two rows, use a grid:

```mdx
<Grid cols={3}>
<Cell rows={2}>…tall, two rows…</Cell>
<Cell span={2}>…wide, two columns…</Cell>
<Cell>…</Cell>
<Cell>…</Cell>
<Cell span={3}>…full width…</Cell>
</Grid>
```

It reflows the same way on screen (at most two columns, then one) and keeps the grid in print.

### Print size

```yaml
print: A1                                    # A0 A1 A2 A3 24x36in 36x48in 42x56in 48x72in
print: { size: A0, orientation: landscape }
print: { width: 900mm, height: 1200mm }      # mm, cm or in
```

Type is designed at A0 (body text 24 pt) and scales with the paper's area, never below 12 pt.
`posuta pdf` writes one vector page at the exact size with the fonts embedded, and **fails if
anything runs past the canvas**, naming the block, so nothing is silently cut. Options:
`--print "A1 landscape"` to try another size, `--out file.pdf`, `--dist dir`, `--page /path`.
It also writes `og.png` next to the page, the image link previews show.

### Site, QR code and previews

Set `site` in `astro.config.mjs` (the template reads `SITE` and `BASE_PATH`, which the Pages
workflow fills in). The printed poster then carries a QR code to its live page, and the page gets
link-preview tags. `qr: https://…` in frontmatter points it elsewhere; `qr: false` removes it.

### Themes

All colours and fonts are CSS custom properties on `:root`, light and dark. Override a few in
frontmatter, or fix the scheme:

```yaml
theme: { accent: "#0a7d55", font-display: "Georgia, serif" }
theme: light
```

A lab can publish its branding as a package holding one CSS file of `:root` tokens (no selectors
needed beyond `:root` and the dark-mode media query), and use it with
`posuta({ theme: "@my-lab/posuta-theme" })`. The default theme sits in a cascade layer, so the
package's tokens win whatever the load order.

### Charts

A chart lives in `charts/<name>.js` and turns rows into
[Observable Plot](https://observablehq.com/plot/) options:

```js
// charts/step.js
export default (d, Plot, state) => ({
  marks: [Plot.lineY(d, { x: "t", y: "y", stroke: "system" })],
});
```

```mdx
<Chart data="step.csv" plot="step" alt="What the chart shows" caption="…" />
```

It is drawn to SVG at build time: it prints as vectors and needs no JavaScript. `data` is a file in
`data/` (CSV, JSON or Parquet) or an array; series longer than 2000 rows are thinned (`max={…}`
to change). `alt` is required. For a one-off static chart, `plot` can also be an inline function,
`plot={(d, Plot) => ({ … })}`.

**Maths in charts:** write `$…$` in any chart text (axis labels, legend entries from your data,
`Plot.text` marks), as in `y: { label: "output $y(t)$" }`. KaTeX renders it at build time, so it
prints as vectors. A live chart with maths also loads KaTeX in the browser (about 75 KB
compressed); other pages don't. The `interactive` tooltip renders maths too.

**Interactive, with no extra code:**

```mdx
<Chart data="step.csv" plot="step" interactive alt="…" />
<Chart data="step.csv" plot="step" alt="…"
  slider={{ name: "t", min: 0, max: 5, step: 0.05, value: 0.8, label: "Time (s)" }} />
```

- `interactive` adds a tooltip and a crosshair that follow the pointer.
- `slider` adds a range input; the chart function receives its value as `state.t` and redraws as
  the reader drags. `value` is the state the poster prints in.

The browser redraws the chart from the same file and the rows embedded in the page; Plot
(about 130 KB compressed) downloads only when a live chart scrolls into view. Pages with only
static charts ship no JavaScript. With JavaScript off, and in print, the chart is the build-time
SVG and the slider is hidden.

For anything else, write a React island (`npx astro add react`) and draw with `PlotFigure`
(`import PlotFigure from "posuta/PlotFigure"`) or with the [plot tools](#posutaplot). It is
server-rendered first, so the props you give the island are the state it prints in.

### Maths

Inline `$\omega_n$` in the text, and display equations with `<Equation tex="\dot x = Ax + Bu" n={1} />`.
KaTeX renders both at build time, with its fonts bundled.

### Figures

```mdx
import tilt from "../../figures/tilt.svg";

<Figure src={tilt} alt="What it shows" caption="…" />
```

SVGs are inlined, so their text uses the poster's fonts and stays vector. For matplotlib, use the
bundled style and save as SVG:

```python
plt.style.use("node_modules/posuta/posuta.mplstyle")  # fonts, colours, text kept as text
plt.savefig("figures/tilt.svg")
```

### Citations

Put `bibliography: refs.bib` (BibTeX, next to the page) in the frontmatter, cite with `[@key]` or
`[@a; @b]`, and place `<References />` where the list goes. Citations are numbered in order of
first use, and the list links each DOI. An unknown key fails the build.

The list is Vancouver by default. Pick another CSL style with
`posuta({ citationStyle: "apa" })` (`vancouver`, `apa`, `harvard1`), or your venue's own:
`citationStyle: "./ieee.csl"`. In-text citations stay numbered.

### Diagrams

Block diagrams from a short YAML spec on a coarse grid, drawn to SVG at build time:

```yaml
# diagrams/loop.yaml
grid: [40, 70]                     # cell width and row height, px
boxes:
  ref:   { at: [0, 0], title: Reference }
  ctl:   { at: [5, 0], w: 4, title: Controller, sub: "PID · 200 Hz", style: highlight }
  plant: { at: [11, 0], title: Vehicle }
groups:
  - { title: Flight controller, boxes: [ctl] }
arrows:
  - ref -> ctl: $p_{ref}$
  - ctl -> plant: $\omega_i$
  - { from: plant, to: ctl, route: under, label: attitude, style: dashed }
```

```mdx
import loop from "../../diagrams/loop.yaml?raw";

<Diagram spec={loop} alt="What the diagram shows" />
```

Arrows route themselves: straight when two boxes share a row or column, an elbow otherwise, or
around the top/bottom with `route: over|under`. `x: <col>` pins a vertical arrow, `side: left`
moves its label. Box styles: `highlight`, `dashed`, `bus`; arrow styles: `highlight`, `alert`,
`dashed`. Labels can hold `$math$`. Quote values that contain commas.

SVG inside `<Diagram>` is drawn on top, in the diagram's pixel coordinates, to annotate it:

```mdx
<Diagram spec={loop} alt="…"><circle cx="230" cy="28" r="6" fill="red" /></Diagram>
```

SVGs from Excalidraw or draw.io still go through `<Figure>`.


## 2. Build your own layout

Delete the template's layout and write your own on `<Canvas>`, the one page-level component:

```astro
---
// src/layouts/Mine.astro
import Canvas from "posuta/Canvas.astro";
import "../styles/poster.css";        // your CSS; no posuta theme
const { frontmatter: fm } = Astro.props;
---
<Canvas title={fm.title} print={fm.print} class="sheet">
  <header class="banner" data-name="the banner"><h1>{fm.title}</h1></header>
  <main class="grid"><slot /></main>
</Canvas>
```

`<Canvas>` renders `<html>`, `<head>` (title, description, link-preview tags, the print page size,
`theme` tokens) and one `div.posuta-canvas` around your content. It takes `title`,
`description`, `print`, `theme`, `lang`, `class` and any other attribute; `<link slot="head" …>`
adds tags to `<head>`. [`test/fixtures/custom`](packages/posuta/test/fixtures/custom) is a whole
poster built this way: a banner, a CSS grid, a hand-drawn SVG, a chart and APA references.

### What posuta's CSS does

`<Canvas>` loads `posuta/base.css`: only what the components need to work.

- In print, the canvas is one page at the paper size, and the root font size follows the paper
  (24 pt at A0, never below 12 pt): size things in `rem` and they scale with the sheet.
- `Row`/`Col` (flex) and `Grid`/`Cell` (CSS grid) reflow on screen; `--posuta-gap` sets the gap.
- `data-print="only"` hides an element on screen; `data-print="hide"` hides it in print.
- Chart and figure SVGs fill their container; the live-chart tooltip is positioned.
- KaTeX's stylesheet.

No colours, fonts, borders or spacing. Everything is in `@layer posuta.base` (and the opt-in
theme in `@layer posuta.theme`), so any CSS you write outside a layer wins, no `!important`
needed. To change the print type scale: `@media print { :root { font-size: 20pt } }`.

### Hooks

Every component forwards `class` and other attributes to its outer element. The parts have
stable classes to style:

| Component | Markup and classes |
| --- | --- |
| `Canvas` | `div.posuta-canvas`; `--paper-w`, `--paper-h`, `--print-scale` in print |
| `Row`, `Col` | `div.posuta-row`, `div.posuta-col` with `--span` |
| `Grid`, `Cell` | `div.posuta-grid` with `--cols`, `div.posuta-cell` with `--span`, `--rows` |
| `Chart` | `figure.posuta-figure.posuta-chart` › `.posuta-plot` (the SVG), `figcaption`, `label.posuta-slider`, `.posuta-tip` |
| `Figure` | `figure.posuta-figure` › `img` or `svg`, `figcaption` |
| `Equation` | `div.posuta-eq` › KaTeX, `span.posuta-eq-n` |
| `Diagram` | `figure.posuta-figure.posuta-diagram` › `svg` with `.box`, `.box-title`, `.box-sub`, `.arrow`, `.arrow-label`, `.group`, `.group-title`, and each style word (`.highlight`, `.alert`, `.dashed`, `.bus`) |
| `References` | `ol.posuta-refs` › `li#ref-<key>` |
| `QR` | `svg.posuta-qr` |

Unstyled, diagrams draw in `currentColor` with no fill, and arrowheads take their arrow's colour.

### The overflow check

`posuta pdf` measures the canvas and names the innermost block that runs past it: any element
whose first child is a heading (`h1`–`h4`), or that has a `data-name`. If no named block
overflows but the canvas does, it says by how much. A page without `<Canvas>` is refused.


## 3. Tools

The functions under the components, for drawing what they don't.

### `posuta pdf`

```sh
posuta pdf [--dist dist] [--page /] [--out <dist>/<page>/poster.pdf] [--print "A1 landscape"] [--base /] [--no-png]
posuta install          # Playwright's Chromium, once
```

### `posuta/print`

```js
import { paper, printCss, PAPER } from "posuta/print";
paper("A1 landscape");  // { width: 841, height: 594, scale: 0.707 }  (mm)
printCss("A1");         // "@page{size:594mm 841mm;margin:0}:root{--paper-w:…}"
```

### `posuta/data`

```js
import { load, downsample } from "posuta/data";
const rows = await load("flight.parquet", { max: 5000 });  // data/ file: CSV, JSON or Parquet
```

### `posuta/plot`

At build time, `renderPlot(options)` returns SVG markup and `plot(options)` an element, both with
`$…$` rendered. In the browser, a custom island gets the same maths and tooltip as `<Chart>`:

```js
import { Plot, plotLive, withPointer, attachTip } from "posuta/plot";

const options = withPointer({ marks: [Plot.lineY(rows, { x: "t", y: "y" })], y: { label: "$y(t)$" } });
const el = await plotLive(options);   // loads KaTeX only if the chart has $…$
box.replaceChildren(el);
attachTip(el, options, box);          // HTML tooltip with maths; box is position: relative
```

`mathify(element, katex)` renders `$…$` inside any SVG or HTML you already have; `tipRows(options, d)`
gives the tooltip's label/value pairs.

### `posuta/tex`

```js
import { tex, texSvg } from "posuta/tex";
tex("gain $K_p$");                                // HTML
texSvg("$x_{k+1}$", 120, 40, { anchor: "middle" }); // an SVG label, baseline at (120, 40)
```

Plain text comes back as `<text fill="currentColor">`; text with maths as KaTeX in a
`foreignObject`. At build time KaTeX is built in; in the browser pass it:
`tex(s, (await import("katex")).default)`.

### `posuta/diagram`

```js
import { layout, draw, route, renderDiagram } from "posuta/diagram";
const g = layout(spec);       // { boxes, groups, arrows, viewBox }: geometry only, in px
g.boxes.find((b) => b.name === "plant").y += 20;
const svg = draw(g);          // = renderDiagram(spec) when unchanged
route(a, b, { route: "over" });  // orthogonal path between two { x, y, w, h } boxes: { pts, seg }
```

A hand-drawn SVG can use `route()` for its arrows and `texSvg()` for its labels (see
`test/fixtures/custom/src/components/Sketch.astro`).

### `posuta/cite`

```js
import { formatReference } from "posuta/cite";
formatReference(cslEntry, "apa");  // one reference as text; vancouver, apa, harvard1 or a .csl path
```

### `posuta/qr`

```js
import { qrSvg } from "posuta/qr";
const svg = await qrSvg("https://lab.example/poster/");
```


## Repository

- `packages/posuta`: the Astro integration, components, base CSS, theme, tools and CLI
- `packages/create-posuta`: `pnpm create posuta`; bundles `template/` when packed
- `template`: the starter poster that `create-posuta` copies; also what `pnpm dev` runs

Release: keep `posuta` and `create-posuta` at the same version (a new poster depends on
`^<create-posuta's version>`), then `pnpm -r publish --access public`.

## License

MIT
