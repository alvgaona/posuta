import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import remarkAutoImport from "../src/remark-auto-import.js";

const components = mkdtempSync(join(tmpdir(), "posuta-components-"));
writeFileSync(join(components, "Chart.astro"), "");   // shadows posuta's Chart
writeFileSync(join(components, "Section.astro"), "");
writeFileSync(join(components, "Section.jsx"), "");   // .astro wins over .jsx
writeFileSync(join(components, "helper.astro"), "");  // not capitalised: ignored

const el = (name, children = []) => ({ type: "mdxJsxFlowElement", name, attributes: [], children });
const esm = (body) => ({ type: "mdxjsEsm", value: "", data: { estree: { type: "Program", body } } });
const imp = (name) => ({ type: "ImportDeclaration", specifiers: [{ local: { name } }] });
const run = (children) => {
  const tree = { type: "root", children };
  remarkAutoImport({ components })(tree);
  return Object.fromEntries(tree.children.filter((n) => n.type === "mdxjsEsm" && n.value)
    .map((n) => [n.data.estree.body[0].specifiers[0].local.name, n.data.estree.body[0].source.value]));
};

test("imports used components: local first, then posuta's", () => {
  const got = run([el("Section", [el("Row", [el("Chart")]), el("Equation")]), el("Unknown"), el("div")]);
  assert.deepEqual(got, {
    Section: join(components, "Section.astro"),
    Row: "posuta/Row.astro",
    Chart: join(components, "Chart.astro"),
    Equation: "posuta/Equation.astro",
  });
});

test("an explicit import or export wins; nothing is added twice", () => {
  const exp = { type: "ExportNamedDeclaration", declaration: { type: "VariableDeclaration", declarations: [{ id: { name: "Row" } }] } };
  assert.deepEqual(run([esm([imp("Chart")]), esm([exp]), el("Chart"), el("Row"), el("Col"), el("Col")]), { Col: "posuta/Col.astro" });
});
