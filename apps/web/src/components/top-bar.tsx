import Link from 'fumadocs-core/link';
import { usePathname } from 'fumadocs-core/framework';
import { SidebarTrigger } from 'fumadocs-ui/components/sidebar/base';
import { SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { Menu } from 'lucide-react';
import type { ComponentProps } from 'react';
import { docsRoute, gitConfig } from '@/lib/shared';
import { Logo } from '@/components/logo';

export const repo = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export const tabs = [
  { text: 'Readme', url: '/' },
  { text: 'Docs', url: docsRoute },
  { text: 'Template', url: `${repo}/tree/${gitConfig.branch}/template` },
  { text: 'npm', url: 'https://www.npmjs.com/package/posuta' },
];

const cell = 'flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider';

/** The bar over the content: equal tabs, the GitHub link as an inverted cell. Phones get title, search and menu. */
export function TopBar() {
  return (
    <header
      id="nd-subnav"
      className="sticky [grid-area:header] top-(--fd-docs-row-1) z-10 flex h-11 border-b bg-fd-background layout:[--fd-header-height:--spacing(11)]"
    >
      <div className="flex flex-1 items-center gap-2 px-4 md:hidden">
        <Link href="/" aria-label="posuta home">
          <Logo className="text-sm" />
        </Link>
        <div className="flex-1" />
        <SearchTrigger hideIfDisabled className="p-2" />
        <SidebarTrigger className="p-2" aria-label="Open menu">
          <Menu className="size-4" />
        </SidebarTrigger>
      </div>
      <TopTabs className="max-md:hidden" />
    </header>
  );
}

/** The tabs, the current one marked with a small square, and GitHub as an icon at the end. */
export function TopTabs({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={`flex flex-1 items-stretch px-2 ${className}`}>
      {tabs.map((tab) => {
        const active = tab.url === '/' ? pathname === '/' : tab.url.startsWith('/') && pathname.startsWith(tab.url);
        return (
          <Link
            key={tab.text}
            href={tab.url}
            data-active={active}
            className={`${cell} group px-4 text-fd-muted-foreground transition-colors hover:text-fd-foreground data-[active=true]:text-fd-foreground`}
          >
            <span className="size-1.5 bg-current opacity-0 group-data-[active=true]:opacity-100" />
            {tab.text}
          </Link>
        );
      })}
      <Link
        href={repo}
        aria-label="GitHub"
        className="ms-auto flex items-center px-3 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        <GitHubIcon className="size-4" />
      </Link>
    </nav>
  );
}

export function GitHubIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.3v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}
