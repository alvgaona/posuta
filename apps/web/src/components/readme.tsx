import Link from 'fumadocs-core/link';
import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from 'fumadocs-ui/components/codeblock';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Provider, type ProviderProps } from '@/components/provider';
import { GitHubIcon, repo, tabs, TopTabs } from '@/components/top-bar';
import { docsRoute } from '@/lib/shared';
import { Logo } from '@/components/logo';

const install = [
  { pm: 'pnpm', cmd: 'pnpm create posuta my-poster' },
  { pm: 'npm', cmd: 'npm create posuta@latest my-poster' },
  { pm: 'yarn', cmd: 'yarn create posuta my-poster' },
  { pm: 'bun', cmd: 'bun create posuta my-poster' },
];

const features: { title: string; text: string; chips: string[] }[] = [
  {
    title: 'One MDX file.',
    text: 'Title, authors and stats in frontmatter, and Markdown and components in the body.',
    chips: ['frontmatter', '<Section>', '<Row>', '<Grid>'],
  },
  {
    title: 'A web page and a PDF.',
    text: 'A static site for any free host, and one vector PDF page at the exact paper size.',
    chips: ['A0', 'A1', '36x48in', 'landscape'],
  },
  {
    title: 'Nothing silently cut.',
    text: 'The PDF export fails if anything runs past the canvas, and names the block.',
    chips: ['posuta pdf', '?print'],
  },
  {
    title: 'Charts that print.',
    text: 'Observable Plot drawn to SVG at build time, and live charts redraw in the browser.',
    chips: ['interactive', 'slider', 'CSV', 'JSON'],
  },
  {
    title: 'Maths with KaTeX.',
    text: 'Rendered at build time, in the text, in equations and in chart labels.',
    chips: ['$\\omega_n$', '<Equation>'],
  },
  {
    title: 'Citations.',
    text: 'BibTeX in, numbered citations and a reference list in any CSL style out.',
    chips: ['[@key]', 'vancouver', 'apa', '.csl'],
  },
  {
    title: 'Figures and video.',
    text: 'Inline SVG keeps your fonts. Videos play on screen and print their poster frame.',
    chips: ['svg', 'matplotlib', 'mp4'],
  },
  {
    title: 'Your layout, your CSS.',
    text: 'Unstyled components with posuta-* hooks. Tailwind and plain CSS both work.',
    chips: ['<Canvas>', 'posuta-*', 'tailwind'],
  },
  {
    title: 'QR code and previews.',
    text: 'The printed poster links to its live page, and link previews get their own image.',
    chips: ['qr', 'og.png', 'site'],
  },
];

/** A section label marked with the same small square as the current tab. */
function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider text-fd-muted-foreground">
      <span className="size-1.5 bg-fd-foreground" />
      {children}
    </h2>
  );
}

/** Print crop marks: a short corner in each corner of the parent. */
function CropMarks() {
  const corner = 'absolute size-4 border-fd-muted-foreground/50';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-4">
      <span className={`${corner} start-0 top-0 border-s border-t`} />
      <span className={`${corner} end-0 top-0 border-e border-t`} />
      <span className={`${corner} start-0 bottom-0 border-s border-b`} />
      <span className={`${corner} end-0 bottom-0 border-e border-b`} />
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="bg-fd-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-fd-muted-foreground">
      {children}
    </span>
  );
}

/** The home page: a fixed panel with the name and links, and the README beside it. */
export function Readme(props: ProviderProps) {
  return (
    <Provider {...props}>
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <aside className="relative flex flex-col justify-between gap-12 overflow-hidden border-b p-6 lg:sticky lg:top-0 lg:h-dvh lg:w-[40%] lg:border-e lg:border-b-0 lg:p-9">
          <CropMarks />
          {/* a faint A-size sheet, the shape every poster starts from */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute end-[12%] top-[11%] hidden aspect-[1/1.414] h-[24%] border border-fd-border lg:block"
          >
            <span className="absolute -bottom-6 start-0 font-mono text-[0.6875rem] text-fd-muted-foreground/70">
              A0 · 841 × 1189 mm
            </span>
          </div>
          <Link href="/" className="relative" aria-label="posuta home">
            <Logo className="text-lg" />
          </Link>
          <div className="relative flex flex-col gap-8">
            <p className="font-mono text-xs uppercase tracking-wider text-fd-muted-foreground">
              ポスター · posutā · poster
            </p>
            <h1 className="max-w-md text-4xl leading-tight tracking-tight lg:text-5xl">
              Research posters for the web and for print
            </h1>
            <div className="flex gap-3">
              <Link
                href={docsRoute}
                className="inline-flex items-center gap-2 bg-fd-foreground px-5 py-2.5 text-fd-background hover:opacity-90"
              >
                Get Started <ArrowRight className="size-4" />
              </Link>
              <Link href={repo} className="inline-flex items-center gap-2 border px-5 py-2.5 hover:bg-fd-accent">
                <GitHubIcon className="size-4" /> GitHub
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-between font-mono text-xs text-fd-muted-foreground">
            <div className="flex gap-3">
              {tabs.slice(1).map((tab, i) => (
                <span key={tab.text} className="flex gap-3">
                  {i > 0 && <span>/</span>}
                  <Link href={tab.url} className="hover:text-fd-foreground">
                    {tab.text}
                  </Link>
                </span>
              ))}
            </div>
            <ThemeSwitch className="rounded-none border-0 p-0 *:rounded-none *:p-1.25" />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-11 border-b bg-fd-background max-md:hidden">
            <TopTabs />
          </header>
          <div className="flex flex-col gap-10 p-6 lg:p-10">
            <section className="flex flex-col gap-6">
              <Heading>Readme</Heading>
              <p className="text-lg text-fd-muted-foreground">
                Write a poster in <span className="text-fd-foreground">MDX</span>, deploy it as a{' '}
                <span className="text-fd-foreground">static site</span> on any free host, and export a{' '}
                <span className="text-fd-foreground">vector PDF</span> at whatever size the conference asks for.
              </p>
              <CodeBlockTabs defaultValue={install[0].pm} className="my-0">
                <CodeBlockTabsList>
                  {install.map(({ pm }) => (
                    <CodeBlockTabsTrigger key={pm} value={pm}>
                      {pm}
                    </CodeBlockTabsTrigger>
                  ))}
                </CodeBlockTabsList>
                {install.map(({ pm, cmd }) => (
                  <CodeBlockTab key={pm} value={pm}>
                    <CodeBlock>
                      <Pre>
                        <code>
                          <span className="line">{cmd}</span>
                        </code>
                      </Pre>
                    </CodeBlock>
                  </CodeBlockTab>
                ))}
              </CodeBlockTabs>
            </section>

            <section className="flex flex-col gap-6">
              <Heading>Features</Heading>
              <div className="grid gap-px border bg-fd-border sm:grid-cols-2 xl:grid-cols-3">
                {features.map((f, i) => (
                  <div key={f.title} className="flex flex-col gap-2 bg-fd-background p-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-medium">{f.title}</h3>
                      <span className="font-mono text-xs text-fd-muted-foreground">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-sm text-fd-muted-foreground">{f.text}</p>
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {f.chips.map((c) => (
                        <Chip key={c}>{c}</Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </Provider>
  );
}
