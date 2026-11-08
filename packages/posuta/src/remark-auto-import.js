// MDX without import lines: <Chart>, <Row>, <Section>… are imported for you.
// Each capitalised JSX name a page uses (or the first part of a dotted one, <Figure.Caption>), but does not import or define itself, is looked up in the
// poster's src/components/ (file name = component name), then in posuta's own components.
// An explicit import always wins.
import { existsSync, readdirSync } from "node:fs";
import { join, parse } from "node:path";

/** posuta's components, by name. */
export const POSUTA = {
  ...Object.fromEntries(["Canvas", "QR", "Row", "Col", "Grid", "Cell", "Chart", "Equation"].map((n) => [n, `posuta/${n}.astro`])),
  Figure: "posuta/Figure", // with its parts: Figure.Root, Figure.Media, Figure.Caption
};
const EXT = [".astro", ".tsx", ".jsx"]; // first wins when two files share a name

/** The poster's own components: { Name: absolute path }, top level of src/components only. */
function local(dir) {
  if (!existsSync(dir)) return {};
  const found = {};
  for (const f of readdirSync(dir)) {
    const { name, ext } = parse(f);
    if (!/^[A-Z]/.test(name) || !EXT.includes(ext)) continue;
    if (!found[name] || EXT.indexOf(ext) < EXT.indexOf(parse(found[name]).ext)) found[name] = join(dir, f);
  }
  return found;
}

/** Names a page binds itself: imports and exported declarations. */
function defined(tree) {
  const names = new Set();
  for (const node of tree.children) {
    if (node.type !== "mdxjsEsm") continue;
    for (const st of node.data?.estree?.body ?? []) {
      if (st.type === "ImportDeclaration") st.specifiers.forEach((s) => names.add(s.local.name));
      const d = st.type === "ExportNamedDeclaration" ? st.declaration : null;
      if (d?.id) names.add(d.id.name);
      d?.declarations?.forEach((v) => v.id?.name && names.add(v.id.name));
    }
  }
  return names;
}

function used(node, names = new Set()) {
  // <Figure.Caption> needs Figure.
  const name = /^([A-Z]\w*)(\.\w+)*$/.exec(node.name ?? "")?.[1];
  if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && name) names.add(name);
  node.children?.forEach((c) => used(c, names));
  return names;
}

const importNode = (name, source) => ({
  type: "mdxjsEsm",
  value: `import ${name} from ${JSON.stringify(source)};`,
  data: {
    estree: {
      type: "Program", sourceType: "module",
      body: [{
        type: "ImportDeclaration",
        specifiers: [{ type: "ImportDefaultSpecifier", local: { type: "Identifier", name } }],
        source: { type: "Literal", value: source, raw: JSON.stringify(source) },
      }],
    },
  },
});

/** @param {{ components: string }} options components: absolute path of the poster's src/components */
export default function remarkAutoImport({ components }) {
  return (tree) => {
    const own = local(components); // read per page, so a new component is picked up on the next edit
    const have = defined(tree);
    const add = [];
    for (const name of used(tree)) {
      if (have.has(name)) continue;
      const source = own[name] ?? POSUTA[name];
      if (source) add.push(importNode(name, source));
    }
    tree.children.unshift(...add);
  };
}
