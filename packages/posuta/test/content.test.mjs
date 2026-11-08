import { strict as assert } from "node:assert";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { downsample, load } from "../src/data.js";
import remarkCite from "../src/remark-cite.js";

const fixtures = fileURLToPath(new URL("fixtures/", import.meta.url));

test("load reads CSV (typed) and JSON", async () => {
  assert.deepEqual([...await load(fixtures + "small.csv")], [{ t: 0, v: 1 }, { t: 1, v: 2 }, { t: 2, v: 3 }]);
  assert.deepEqual(await load(fixtures + "small.json"), [{ t: 0, v: 1 }, { t: 1, v: 2 }]);
  await assert.rejects(load(fixtures + "refs.bib"), /use .csv or .json/);
});

test("downsample keeps first and last rows and the requested count", () => {
  const rows = Array.from({ length: 10001 }, (_, i) => i);
  const out = downsample(rows, 100);
  assert.equal(out.length, 100);
  assert.equal(out[0], 0);
  assert.equal(out.at(-1), 10000);
  assert.equal(downsample([1, 2], 100).length, 2);
});

const text = (value) => ({ type: "text", value });
const run = (children, bibliography = "refs.bib", frontmatter = { bibliography }) => {
  const tree = { type: "root", children };
  remarkCite()(tree, { path: fixtures + "poster.mdx", data: { astro: { frontmatter } } });
  return tree;
};
const refs = { type: "mdxJsxFlowElement", name: "References", children: [] };

test("citations are numbered by first use and listed with DOI links", () => {
  const tree = run([
    { type: "paragraph", children: [text("See [@knuth1984tex] and [@bostock2011d3; @knuth1984tex].")] },
    refs,
  ]);
  const p = tree.children[0].children;
  assert.deepEqual(p.filter((n) => n.type === "cite").map((n) => n.data.hProperties.className), [["posuta-cite"], ["posuta-cite"]]);
  const nums = p.flatMap((n) => n.children ?? []).filter((n) => n.type === "link").map((n) => [n.url, n.children[0].value]);
  assert.deepEqual(nums, [["#ref-knuth1984tex", "1"], ["#ref-bostock2011d3", "2"], ["#ref-knuth1984tex", "1"]]);
  const list = tree.children[1];
  assert.equal(list.type, "list");
  assert.deepEqual(list.children.map((li) => li.data.hProperties.id), ["ref-knuth1984tex", "ref-bostock2011d3"]);
  const doi = list.children[1].children[0].children.find((n) => n.type === "link");
  assert.equal(doi.url, "https://doi.org/10.1109/TVCG.2011.185");
});

test("an unknown key or a missing <References /> fails the build", () => {
  assert.throws(() => run([{ type: "paragraph", children: [text("[@nope]")] }, refs]), /\[@nope\] is not in the bibliography/);
  assert.throws(() => run([{ type: "paragraph", children: [text("[@knuth1984tex]")] }]), /add <References \/>/);
});

test("References parts get the cited entries on frontmatter.references", () => {
  const fm = { bibliography: "refs.bib" };
  const root = { type: "mdxJsxFlowElement", name: "References.Root", children: [] };
  const tree = run([{ type: "paragraph", children: [text("[@bostock2011d3]")] }, root], undefined, fm);
  assert.equal(tree.children[1], root); // parts are left for the page to render
  assert.deepEqual(fm.references.map(({ key, n, doi }) => [key, n, doi]), [["bostock2011d3", 1, "10.1109/TVCG.2011.185"]]);
  assert.match(fm.references[0].text, /^Bostock M/);
});

test("frontmatter citations are numbered first; notes are added and URLs linked", async () => {
  const fm = { bibliography: "refs.bib", lede: "Built on [@plot2021].", stats: [{ label: "as in [@knuth1984tex]" }] };
  const tree = run([{ type: "paragraph", children: [text("[@bostock2011d3]")] }, refs], undefined, fm);
  assert.deepEqual(fm.references.map((r) => [r.key, r.n]), [["plot2021", 1], ["knuth1984tex", 2], ["bostock2011d3", 3]]);
  assert.match(fm.references[0].text, /https:\/\/observablehq\.com\/plot\/ \(Software\)$/);
  const url = tree.children[1].children[0].children[0].children.find((n) => n.type === "link");
  assert.equal(url.url, "https://observablehq.com/plot/");

  const { md } = await import("../src/md.js");
  const html = await md("**Built** on $x$ [@plot2021; @knuth1984tex].", fm.references);
  assert.match(html, /^<strong>Built<\/strong> on <span class="katex">/);
  assert.match(html, /<span class="posuta-cite">\[<a href="#ref-plot2021">1<\/a>, <a href="#ref-knuth1984tex">2<\/a>\]<\/span>\.$/);
  await assert.rejects(md("[@nope]", fm.references), /\[@nope\] is not on frontmatter.references/);
  assert.equal(await md(undefined), "");
});

test("withPointer adds a crosshair and a pointer dot; tipRows labels values from the scales", async () => {
  const { Plot, withPointer, tipRows } = await import("../src/plot.js");
  const d = [{ t: 0.123456, y: 1, s: "$\\zeta$" }];
  const rule = Plot.ruleY([1]);
  const line = Plot.lineY(d, { x: "t", y: "y", stroke: "s" });
  const options = { x: { label: "time $t$ (s)" }, marks: [rule, line] };
  const out = withPointer(options);
  assert.equal(out.marks.length, 4);
  assert.deepEqual(withPointer({ marks: [rule] }).marks, [rule]); // nothing to point at
  const faceted = withPointer({ marks: [Plot.dot(d, { x: "t", y: "y", fy: "s" })] }).marks;
  assert.equal(faceted.at(-1).fy, "s"); // the pointer dot stays in its facet
  // stroke and z share a field, so it is listed once; the x label keeps its maths
  assert.deepEqual(tipRows(options, d[0]), [["s", "$\\zeta$"], ["time $t$ (s)", "0.1235"], ["y", "1"]]);
});

test("$…$ in chart text becomes KaTeX in place, at build time", async () => {
  const { Plot, renderPlot } = await import("../src/plot.js");
  const d = [{ t: 0, y: 1, s: "$\\zeta = 0.2$" }];
  const html = renderPlot({
    x: { label: "time $t$ (s)" }, color: { legend: true },
    marks: [Plot.lineY(d, { x: "t", y: "y", stroke: "s" }), Plot.text(d, { x: "t", y: "y", text: () => "$\\omega$", dx: 8 })],
  });
  assert.equal((html.match(/<foreignObject/g) ?? []).length, 2); // axis label and text mark
  assert.match(html, /<span><span class="katex">/); // the HTML legend
  assert.doesNotMatch(html.replace(/<annotation[^]*?<\/annotation>/g, ""), /\$/);
  assert.match(html, /<g transform="translate\(8,0\)"[^>]*><foreignObject/); // offset kept
});
