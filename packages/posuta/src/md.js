// Inline Markdown in frontmatter text (a lede, a stat label) or a prop (a subtitle, a caption) →
// HTML: emphasis, links, `code`, $…$ maths, and [@key] citations numbered as on the page.
//   <p class="lede" set:html={await md(lede, frontmatter.references)} />
// Citations in a component's string props are numbered by posuta already, so md(sub) needs no list.
// Its own unified pipeline: @astrojs/markdown-remark would bundle the MDX compiler and warn.
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import { unified } from "unified";
import { CITE, citeHtml, citeParts } from "./remark-cite.js";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkSmartypants).use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeKatex).use(rehypeStringify, { allowDangerousHtml: true });

/**
 * @param {string | undefined} text
 * @param {{ key: string, n: number }[]} [references] frontmatter.references
 */
export async function md(text, references = []) {
  if (text == null) return "";
  const n = new Map(references.map((r) => [r.key, r.n]));
  const number = (key) => {
    if (!n.has(key)) throw new Error(`posuta md: [@${key}] is not on frontmatter.references (is \`bibliography\` set?)`);
    return n.get(key);
  };
  const src = String(text).replace(CITE, (_, inner) => citeHtml(citeParts(inner), number));
  const code = String(await processor.process(src));
  // One paragraph comes back without its <p>, to go inside the author's own element.
  return code.trim().replace(/^<p>((?:(?!<p>)[\s\S])*)<\/p>$/, "$1");
}
