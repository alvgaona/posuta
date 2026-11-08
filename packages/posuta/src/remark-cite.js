// Citations: `bibliography: refs.bib` in frontmatter, `[@key]` or `[@a; @b]` in the text, and
// `<References />` where the list goes. Numbered in order of first citation (frontmatter text
// first, for md()), with DOI and URL links and the BibTeX note. In the text each citation is a
// span.posuta-cite. The cited entries are also on frontmatter.references, for References.Root/Item.
// The list is formatted with a CSL style: vancouver (default), apa, harvard1, or a .csl file.
// shortcut: in-text citations are always numbers [1]; add author-date markers if a style needs them.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";

export const CITE = /\[(@[\w:.\-/+]+(?:\s*;\s*@[\w:.\-/+]+)*)\]/g;
const HAS_CITE = new RegExp(CITE.source); // no /g: .test() must not keep state
const URL_RE = /(https?:\/\/\S*[^\s.,;:)\]])/; // trailing punctuation stays text

/** Reference text → alternating [text, url, text, …], for linking the URLs in it. */
export const urlParts = (text) => text.split(URL_RE);

/** A CSL style name, or the path of a .csl file (registered on first use). */
function template(style) {
  const styles = plugins.config.get("@csl").styles;
  if (style.endsWith(".csl")) {
    if (!styles.has(style)) styles.add(style, readFileSync(style, "utf8"));
  } else if (!styles.has(style)) {
    throw new Error(`posuta: unknown citation style "${style}"; use vancouver, apa, harvard1 or a path to a .csl file`);
  }
  return style;
}

/**
 * One CSL-JSON entry as plain text in a CSL style, without its list number or DOI (posuta adds
 * the DOI as a link).
 * @param {object} entry CSL-JSON, e.g. from new Cite(bibtex).data
 * @param {string} [style] vancouver (default), apa, harvard1, or an absolute path to a .csl file
 */
export function formatReference(entry, style = "vancouver") {
  return new Cite(entry).format("bibliography", { format: "text", template: template(style) })
    .trim().replace(/^\[?\d+[.\]]\s*/, "")
    .replace(/\s*(Available (at|from):?\s*)?(doi:\s*|https?:\/\/(dx\.)?doi\.org\/)\S+$/i, "");
}

/** @param {{ style?: string }} [options] style: as for formatReference */
export default function remarkCite({ style = "vancouver" } = {}) {
  template(style); // fail at startup on an unknown style
  return (tree, file) => {
    const order = [];
    let refsNode = null;
    let hasParts = false;
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
        if ((child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement") && /^References(\.|$)/.test(child.name ?? "")) {
          if (child.name === "References") refsNode = { parent: node, child };
          else { hasParts = true; walk(child); }
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
          const inner = [{ type: "text", value: "[" }];
          links.forEach((l, j) => inner.push(...(j ? [{ type: "text", value: ", " }] : []), l));
          inner.push({ type: "text", value: "]" });
          parts.push({ type: "cite", data: { hName: "span", hProperties: { className: ["posuta-cite"] } }, children: inner });
          last = m.index + m[0].length;
        }
        if (last < child.value.length) parts.push({ type: "text", value: child.value.slice(last) });
        node.children.splice(i, 1, ...parts);
        i += parts.length - 1;
      }
    };
    // Frontmatter text (a lede, a stat label) comes first on the poster, so it is numbered first.
    const fm = file.data.astro?.frontmatter;
    const strings = (v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(strings) : []);
    for (const str of strings(fm)) for (const m of str.matchAll(CITE)) {
      for (const key of m[1].split(";").map((k) => k.trim().slice(1))) {
        if (!bib().has(key)) throw new Error(`${file.path}: [@${key}] in the frontmatter is not in the bibliography`);
        if (!order.includes(key)) order.push(key);
      }
    }
    walk(tree);

    if (!order.length && !refsNode && !hasParts) return;
    if (!refsNode && !hasParts) throw new Error(`${file.path}: add <References /> where the reference list should go`);
    const refs = order.map((key, i) => {
      const e = bib().get(key);
      let text = formatReference(e, style);
      if (e.note && !text.includes(e.note)) text += ` (${e.note})`; // as BibTeX prints it
      return { key, n: i + 1, text, ...(e.DOI && { doi: e.DOI }) };
    });
    if (fm) fm.references = refs;
    if (!refsNode) return;
    const list = {
      type: "list", ordered: true, spread: false, data: { hProperties: { className: ["posuta-refs"] } },
      children: refs.map(({ key, text, doi }) => {
        const children = urlParts(text + (doi ? " " : "")).map((p, j) => (j % 2
          ? { type: "link", url: p, children: [{ type: "text", value: p }] } : { type: "text", value: p }));
        if (doi) children.push({ type: "link", url: `https://doi.org/${doi}`, children: [{ type: "text", value: `doi:${doi}` }] });
        return { type: "listItem", spread: false, data: { hProperties: { id: `ref-${key}` } }, children: [{ type: "paragraph", children }] };
      }),
    };
    const { parent, child } = refsNode;
    parent.children.splice(parent.children.indexOf(child), 1, list);
  };
}
