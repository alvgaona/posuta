import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { docsRoute, gitConfig } from './shared';
import { Logo } from '@/components/logo';

export function baseOptions(): BaseLayoutProps {
  const repo = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
  return {
    nav: {
      // JSX supported
      title: <Logo className="text-sm" />,
    },
    links: [
      { text: 'Docs', url: docsRoute, active: 'nested-url' },
      { text: 'Template', url: `${repo}/tree/${gitConfig.branch}/template`, external: true },
      { text: 'npm', url: 'https://www.npmjs.com/package/@posuta/posuta', external: true },
    ],
    githubUrl: repo,
  };
}
