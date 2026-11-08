// Citations: `bibliography: refs.bib` in frontmatter, `[@key]` or `[@a; @b]` in the text, and
// `<References />` where the list goes. Numbered in order of first citation, with DOI links.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";

const CITE = /\[(@[\w:.\-/+]+(?:\s*;\s*@[\w:.\-/+]+)*)\]/g;
const HAS_CITE = new RegExp(CITE.source); // no /g: .test() must not keep state

/** Vancouver text for one CSL entry, without its number and DOI (the DOI becomes a link). */
function format(entry) {
  return new Cite(entry).format("bibliography", { format: "text", template: "vancouver" })
    .trim().replace(/^\d+\.\s*/, "").replace(/\s*doi:\S+$/i, "");
}

export default function remarkCite() {
  return (tree, file) => {
    const order = [];
    let refsNode = null;
    let entries = null;
    const bib = () => {
      if (entries) return entries;
      const path = file.data.astro?.frontmatter?.bibliography;
      if (!path) throw new Error(`${file.path}: [@key] citations need \`bibliography: refs.bib\` in the frontmatter`);
      const data = new Cite(readFileSync(resolve(dirname(file.path), path), "utf8")).data;
      return (entries = new Map(data.map((e) => [e.id, e])));
    };

    const walk = (node) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if ((child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement") && child.name === "References") {
          refsNode = { parent: node, child };
          continue;
        }
        if (child.type !== "text" || !HAS_CITE.test(child.value)) { walk(child); continue; }
        const parts = [];
        let last = 0;
        for (const m of child.value.matchAll(CITE)) {
          if (m.index > last) parts.push({ type: "text", value: child.value.slice(last, m.index) });
          const keys = m[1].split(";").map((k) => k.trim().slice(1));
          const links = keys.map((key) => {
            if (!bib().has(key)) throw new Error(`${file.path}: [@${key}] is not in the bibliography`);
            if (!order.includes(key)) order.push(key);
            return { type: "link", url: `#ref-${key}`, children: [{ type: "text", value: String(order.indexOf(key) + 1) }] };
          });
          parts.push({ type: "text", value: "[" });
          links.forEach((l, j) => parts.push(...(j ? [{ type: "text", value: ", " }] : []), l));
          parts.push({ type: "text", value: "]" });
          last = m.index + m[0].length;
        }
        if (last < child.value.length) parts.push({ type: "text", value: child.value.slice(last) });
        node.children.splice(i, 1, ...parts);
        i += parts.length - 1;
      }
    };
    walk(tree);

    if (!order.length && !refsNode) return;
    if (!refsNode) throw new Error(`${file.path}: add <References /> where the reference list should go`);
    const list = {
      type: "list", ordered: true, spread: false, data: { hProperties: { className: ["posuta-refs"] } },
      children: order.map((key) => {
        const e = bib().get(key);
        const children = [{ type: "text", value: format(e) + (e.DOI ? " " : "") }];
        if (e.DOI) children.push({ type: "link", url: `https://doi.org/${e.DOI}`, children: [{ type: "text", value: `doi:${e.DOI}` }] });
        return { type: "listItem", spread: false, data: { hProperties: { id: `ref-${key}` } }, children: [{ type: "paragraph", children }] };
      }),
    };
    const { parent, child } = refsNode;
    parent.children.splice(parent.children.indexOf(child), 1, list);
  };
}
