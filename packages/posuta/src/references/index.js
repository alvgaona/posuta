// The reference list as parts. <References /> (handled by the citation plugin) covers the usual
// case; to lay the list out yourself, map the entries cited on the page:
//   <References.Root>{frontmatter.references.map((e) => <References.Item entry={e} />)}</References.Root>
import Item from "./Item.astro";
import Root from "./Root.astro";

export default { Root, Item };
export { Root, Item };
