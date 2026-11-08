// Inline Markdown in frontmatter text (a lede, a stat label) → HTML: emphasis, links, `code`,
// $…$ maths, and [@key] citations numbered as on the page (pass frontmatter.references).
//   <p class="lede" set:html={await md(lede, frontmatter.references)} />
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { CITE } from "./remark-cite.js";

let processor;

/**
 * @param {string | undefined} text
 * @param {{ key: string, n: number }[]} [references] frontmatter.references
 */
export async function md(text, references = []) {
  if (text == null) return "";
  const n = new Map(references.map((r) => [r.key, r.n]));
  const src = String(text).replace(CITE, (_, keys) => {
    const links = keys.split(";").map((k) => k.trim().slice(1)).map((key) => {
      if (!n.has(key)) throw new Error(`posuta md: [@${key}] is not on frontmatter.references (is \`bibliography\` set?)`);
      return `<a href="#ref-${key}">${n.get(key)}</a>`;
    });
    return `<span class="posuta-cite">[${links.join(", ")}]</span>`;
  });
  processor ??= createMarkdownProcessor({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex], syntaxHighlight: false });
  const { code } = await (await processor).render(src);
  // One paragraph comes back without its <p>, to go inside the author's own element.
  return code.trim().replace(/^<p>((?:(?!<p>)[\s\S])*)<\/p>$/, "$1");
}
