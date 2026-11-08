import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

// The examples' source, shown as the Code tab: what renders is exactly what's shown.
const sources = import.meta.glob<string>('/src/previews/*.astro', { query: '?raw', import: 'default', eager: true });

/** The MDX of an example: its file without the frontmatter (imports, data) and <style> (the look). */
function source(name: string) {
  const raw = sources[`/src/previews/${name}.astro`];
  if (raw === undefined) throw new Error(`No example src/previews/${name}.astro`);
  return raw.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/<style[\s\S]*?<\/style>/g, '').trim();
}

/** A posuta example from src/pages/preview/[name].astro; the example sizes the iframe itself. */
export function Preview({ name, title = name }: { name: string; title?: string }) {
  return (
    <div className="not-prose my-6 border">
      <Frame name={name} title={title} />
    </div>
  );
}

function Frame({ name, title }: { name: string; title: string }) {
  return <iframe src={`/preview/${name}`} title={title} loading="lazy" className="block h-64 w-full" />;
}

/** An example with Preview and Code tabs, as on a component page. */
export function ComponentPreview({ name, title = name }: { name: string; title?: string }) {
  return (
    <Tabs items={['Preview', 'Code']} className="not-prose">
      <Tab value="Preview" className="p-0">
        <Frame name={name} title={title} />
      </Tab>
      <Tab value="Code">
        <DynamicCodeBlock lang="astro" code={source(name)} />
      </Tab>
    </Tabs>
  );
}
