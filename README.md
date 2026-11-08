# posuta

Research posters for the web and for print. ポスター (*posutā*), "poster"; the poster sibling of
suraido (slides).

Write a poster in MDX, deploy it as a static site on any free host, and export a vector PDF at
whatever size the conference asks for.


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
```

`posuta pdf` uses Playwright's Chromium; install it once with `pnpm exec posuta install`.

## Write a poster

```mdx
---
layout: posuta/Poster.astro
title: A Hexacopter That Keeps Flying After Losing a Motor,
highlight: with Rotors Tilted 17° Inward
lede: One paragraph that says what the poster shows.
stats:
  - { value: "≤ 1.5°", label: "tilt with any one motor off", accent: true }
---
import Section from "posuta/Section.astro";

<Section n={1} title="The problem">

Plain **Markdown** here.

</Section>
```

`astro.config.mjs` needs one line: `integrations: [posuta()]`.

### Columns

```mdx
<Row>
<Col>…</Col>
<Col span={2}>…twice as wide…</Col>
</Row>
```

On screen a row reflows by width (three columns, then two, then one on a phone). In print it keeps
the columns as written.

### Print size

```yaml
print: A1                                    # A0 A1 A2 A3 24x36in 36x48in 42x56in 48x72in
print: { size: A0, orientation: landscape }
print: { width: 900mm, height: 1200mm }      # mm, cm or in
```

Type is designed at A0 (body text 24 pt) and scales with the paper's area, never below 12 pt.
`posuta pdf` writes one vector page at the exact size with the fonts embedded, and **fails if
anything runs past the canvas**, naming the section, so nothing is silently cut. Options:
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
import Chart from "posuta/Chart.astro";

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
(`import PlotFigure from "posuta/PlotFigure"`, `import { Plot } from "posuta/plot"`). It is
server-rendered first, so the props you give the island are the state it prints in.

Data helpers for your own code: `import { load } from "posuta/data"`.

### Maths

Inline `$\omega_n$` in the text, and display equations with
`<Equation tex="\dot x = Ax + Bu" n={1} />` (`import Equation from "posuta/Equation.astro"`).
KaTeX renders both at build time, with its fonts bundled.

### Figures

```mdx
import Figure from "posuta/Figure.astro";
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

### Diagrams

Block diagrams from a short YAML spec on a coarse grid, drawn to SVG at build time in the theme's
colours (light and dark):

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
import Diagram from "posuta/Diagram.astro";
import loop from "../../diagrams/loop.yaml?raw";

<Diagram spec={loop} alt="What the diagram shows" />
```

Arrows route themselves: straight when two boxes share a row or column, an elbow otherwise, or
around the top/bottom with `route: over|under`. `x: <col>` pins a vertical arrow, `side: left`
moves its label. Box styles: `highlight`, `dashed`, `bus`; arrow styles: `highlight`, `alert`,
`dashed`. Labels can hold `$math$`. Quote values that contain commas. SVGs from Excalidraw or
draw.io still go through `<Figure>`.

## Layout

- `packages/posuta`: the Astro integration, layout, components and theme
- `packages/create-posuta`: `pnpm create posuta`; bundles `template/` when packed
- `template`: the starter poster that `create-posuta` copies; also what `pnpm dev` runs

Release: keep `posuta` and `create-posuta` at the same version (a new poster depends on
`^<create-posuta's version>`), then `pnpm -r publish --access public`.

## License

MIT
