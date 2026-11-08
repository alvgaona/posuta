import { type SerializedPageTree, useFumadocsLoader } from 'fumadocs-core/source/client';
import type { TOCItemType } from 'fumadocs-core/toc';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import {
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { Provider, type ProviderProps } from '@/components/provider';
import { baseOptions } from '@/lib/layout.shared';
import { TopBar } from '@/components/top-bar';
import { Sidebar } from '@/components/sidebar';
import {
  SidebarCollapseTrigger,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from 'fumadocs-ui/components/sidebar/base';

export interface DocsProps extends ProviderProps {
  tree: SerializedPageTree;
  title: string;
  description?: string;
  toc: TOCItemType[];
  markdownUrl: string;
  githubUrl: string;
}

/**
 * The React island of docs pages, the content is passed as children.
 */
export function Docs({
  tree,
  title,
  description,
  toc,
  markdownUrl,
  githubUrl,
  children,
  ...props
}: DocsProps) {
  const data = useFumadocsLoader({ tree });

  return (
    <Provider {...props}>
      <DocsLayout
        {...baseOptions()}
        nav={{ ...baseOptions().nav, mode: 'auto', component: <TopBar /> }}
        sidebar={{ collapsible: false }}
        slots={{
          sidebar: {
            provider: SidebarProvider,
            root: Sidebar,
            trigger: SidebarTrigger,
            collapseTrigger: SidebarCollapseTrigger,
            useSidebar,
          },
        }}
        tree={data.tree}
      >
        <DocsPage toc={toc} breadcrumb={{ enabled: false }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <DocsTitle>{title}</DocsTitle>
            <div className="flex flex-row gap-1 items-center shrink-0">
              <MarkdownCopyButton markdownUrl={markdownUrl} className="font-mono uppercase tracking-wider bg-transparent border-transparent text-fd-muted-foreground hover:bg-transparent hover:text-fd-foreground" />
              <ViewOptionsPopover
                markdownUrl={markdownUrl}
                githubUrl={githubUrl}
                className="font-mono uppercase tracking-wider bg-transparent border-transparent text-fd-muted-foreground hover:bg-transparent hover:text-fd-foreground"
              />
            </div>
          </div>
          <DocsDescription>{description}</DocsDescription>
          {children}
        </DocsPage>
      </DocsLayout>
    </Provider>
  );
}
