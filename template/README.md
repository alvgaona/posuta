# My poster

A research poster made with [posuta](https://github.com/alvgaona/posuta): a web page and a
printable PDF from one MDX file.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/OWNER/REPO)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/OWNER/REPO)

Replace `OWNER/REPO` in the two links above with this repository's.

## Edit

- Text, sections and frontmatter: `src/pages/index.mdx`
- Header, footer and QR code: `src/layouts/Poster.astro`; the look: `posuta/theme.css`, or your own CSS
- Your components: `src/components/` (used in the MDX without import lines, like `<Section>`)
- References: `src/pages/refs.bib`
- Charts: `charts/` (one file per chart), their data in `data/`

```sh
pnpm install
pnpm dev     # live preview at http://localhost:4321
pnpm pdf     # dist/poster.pdf at the print size (run `pnpm exec posuta install` once first)
```

## Publish

Push to GitHub and turn on Pages (Settings → Pages → Source: GitHub Actions). Every push to
`main` builds the page, exports the PDF to `<your page>/poster.pdf`, and attaches it to the
workflow run. The printed poster carries a QR code to the live page.
