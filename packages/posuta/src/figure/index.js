// Figure and its parts: <Figure src alt caption /> for the usual case, or build your own:
//   <Figure.Root><Figure.Caption>…</Figure.Caption><a href="…"><Figure.Media src alt /></a></Figure.Root>
import Figure from "../Figure.astro";
import Caption from "./Caption.astro";
import Media from "./Media.astro";
import Root from "./Root.astro";

export default Object.assign(Figure, { Root, Media, Caption });
export { Root, Media, Caption };
