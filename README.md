# posuta

Research posters for the web and for print. ポスター (*posutā*), "poster"; the poster sibling of
suraido (slides).

Write a poster in MDX, deploy it as a static site on any free host, and export a vector PDF at
whatever size the conference asks for.

> Early scaffold. Working now: the poster layout, numbered sections and the default theme.

## Try it

```sh
pnpm install
pnpm dev     # the starter poster in template/ at http://localhost:4321
pnpm build   # static site in template/dist
```

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

## Layout

- `packages/posuta`: the Astro integration, layout, components and theme
- `template`: the starter poster that `create-posuta` will copy; also what `pnpm dev` runs

## License

MIT
