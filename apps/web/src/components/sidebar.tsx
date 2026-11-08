import Link from 'fumadocs-core/link';
import {
  SidebarContent,
  SidebarDrawerContent,
  SidebarDrawerOverlay,
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
  SidebarTrigger,
  useFolderDepth,
} from 'fumadocs-ui/components/sidebar/base';
import { createPageTreeRenderer } from 'fumadocs-ui/components/sidebar/page-tree';
import { FullSearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Logo } from '@/components/logo';
import { GitHubIcon, repo, tabs } from '@/components/top-bar';

// Better Auth style: groups are full-width rows split by lines, pages sit indented under them.
const row = 'flex w-full items-center gap-2 px-4 text-start [&_svg]:size-4 [&_svg]:shrink-0 transition-colors';

function Item({ className, ...props }: ComponentProps<typeof SidebarItem>) {
  const nested = useFolderDepth() > 0;
  return (
    <SidebarItem
      className={`${row} ${nested ? 'py-1.5 ps-9' : 'py-2.5 border-b'} text-fd-muted-foreground hover:text-fd-foreground data-[active=true]:bg-fd-accent data-[active=true]:text-fd-foreground ${className ?? ''}`}
      {...props}
    />
  );
}

const PageTree = createPageTreeRenderer({
  SidebarItem: Item,
  SidebarFolder: (props) => <SidebarFolder className="border-b" {...props} />,
  SidebarFolderTrigger: (props) => (
    // the chevron points down when closed and up when open
    <SidebarFolderTrigger
      className={`${row} py-2.5 hover:bg-fd-accent/50 [&>svg:last-child]:rotate-0 data-panel-open:[&>svg:last-child]:rotate-180`}
      {...props}
    />
  ),
  SidebarFolderLink: (props) => (
    <SidebarFolderLink className={`${row} py-2.5 hover:bg-fd-accent/50`} {...props} />
  ),
  SidebarFolderContent: (props) => <SidebarFolderContent className="flex flex-col pb-1.5" {...props} />,
  SidebarSeparator: (props) => (
    <SidebarSeparator className="px-4 pt-4 pb-1.5 text-xs text-fd-muted-foreground" {...props} />
  ),
});

function Body({ drawer = false }: { drawer?: boolean }) {
  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <Link href="/" aria-label="posuta home">
          <Logo className="text-sm" />
        </Link>
        {drawer && (
          <SidebarTrigger aria-label="Close menu" className="p-1 text-fd-muted-foreground">
            <X className="size-4" />
          </SidebarTrigger>
        )}
      </div>
      <FullSearchTrigger
        hideIfDisabled
        className="w-full shrink-0 rounded-none border-0 border-b bg-transparent px-4 py-2 text-sm"
      />
      <nav className="min-h-0 flex-1 overflow-y-auto">
        {drawer &&
          tabs.map((tab) => (
            <Link key={tab.text} href={tab.url} className={`${row} py-2.5 border-b text-fd-muted-foreground hover:text-fd-foreground`}>
              {tab.text}
            </Link>
          ))}
        <PageTree />
      </nav>
      <div className="flex shrink-0 items-center justify-between border-t px-4 py-1 text-fd-muted-foreground">
        <Link href={repo} aria-label="GitHub" className="p-1.5 hover:text-fd-foreground">
          <GitHubIcon className="size-4" />
        </Link>
        <ThemeSwitch className="rounded-none border-0 p-0 *:rounded-none *:p-1.25" />
      </div>
    </>
  );
}

/** The whole sidebar: a sticky column on desktop, a drawer on phones. */
export function Sidebar() {
  return (
    <>
      <SidebarContent>
        {({ ref }) => (
          <div className="sticky z-20 [grid-area:sidebar] top-(--fd-docs-row-1) h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] md:layout:[--fd-sidebar-width:268px] max-md:hidden">
            <aside
              id="nd-sidebar"
              ref={ref}
              className="flex h-full w-(--fd-sidebar-width) flex-col border-e bg-fd-background text-sm"
            >
              <Body />
            </aside>
          </div>
        )}
      </SidebarContent>
      <SidebarDrawerOverlay className="fixed inset-0 z-40 backdrop-blur-xs data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out" />
      <SidebarDrawerContent className="fixed inset-y-0 end-0 z-40 flex w-[85%] max-w-[380px] flex-col border-s bg-fd-background text-sm data-[state=open]:animate-fd-sidebar-in data-[state=closed]:animate-fd-sidebar-out">
        <Body drawer />
      </SidebarDrawerContent>
    </>
  );
}
