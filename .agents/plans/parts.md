# Parts, Base UI style

Status: in progress (Figure and References done).

A component fixes its markup, and CSS can't move a caption or wrap an image in a link. So every
component with inner structure also comes as parts the author arranges, as in Base UI:
`<Figure.Root>`, `<Figure.Media>`, `<Figure.Caption>`. The one-line form stays, built from the
parts. Parts render one element each (a video's print frame is the exception), take `class` and
attributes, and `as` where the element can vary. Astro has no context, so a part that needs data
takes it as a prop; parts that work together in the browser find each other inside their Root.

Tailwind and plain CSS must both style every part: `<Canvas>` declares the layer order (see
AGENTS.md), and the test fixture's `/tailwind/` page checks it.

## Steps

1. **Figure** (done): Root, Media (image, SVG, video with a print frame), Caption. Dotted names
   auto-import. Tailwind page in `test/fixtures/custom`.
2. **References** (done): Root and Item. The citation plugin puts the cited entries on
   `frontmatter.references`; the page maps them to Items. `<References />` stays as the preset.
   Tailwind page in `test/fixtures/custom`.
3. **Equation**: Root, Math, Number.
4. **Chart**: Root, Plot, Slider, Caption, Tooltip. The slider and tooltip find their plot inside
   Root in the browser; the build-time state comes from the slider's `value`.

**Done when** each has a fixture page that rearranges its parts, and the presets render as before.
