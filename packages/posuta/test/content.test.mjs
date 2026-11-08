import { strict as assert } from "node:assert";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { downsample, load } from "../src/data.js";
import remarkCite from "../src/remark-cite.js";

const fixtures = fileURLToPath(new URL("fixtures/", import.meta.url));

test("load reads CSV (typed), JSON and Parquet (bigint → number)", async () => {
  assert.deepEqual([...await load(fixtures + "small.csv")], [{ t: 0, v: 1 }, { t: 1, v: 2 }, { t: 2, v: 3 }]);
  assert.deepEqual(await load(fixtures + "small.json"), [{ t: 0, v: 1 }, { t: 1, v: 2 }]);
  const pq = await load(fixtures + "small.parquet");
  assert.deepEqual(pq[2], { t: 2, v: 2.5, n: 3 });
  await assert.rejects(load(fixtures + "refs.bib"), /use .csv, .json or .parquet/);
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
const run = (children, bibliography = "refs.bib") => {
  const tree = { type: "root", children };
  remarkCite()(tree, { path: fixtures + "poster.mdx", data: { astro: { frontmatter: { bibliography } } } });
  return tree;
};
const refs = { type: "mdxJsxFlowElement", name: "References", children: [] };

test("citations are numbered by first use and listed with DOI links", () => {
  const tree = run([
    { type: "paragraph", children: [text("See [@knuth1984tex] and [@bostock2011d3; @knuth1984tex].")] },
    refs,
  ]);
  const p = tree.children[0].children;
  const nums = p.filter((n) => n.type === "link").map((n) => [n.url, n.children[0].value]);
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
