import type { ComponentProps } from 'react';
import { appName } from '@/lib/shared';

/** The mark: a page cut into a P. The same path is in public/favicon.svg. */
export function Mark(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" fillRule="evenodd" d="M4 2h16v13h-7v7H4z M9 6v5h7V6z" />
    </svg>
  );
}

/** Mark and wordmark (Geist Mono, uppercase). */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-mono uppercase tracking-[0.08em] ${className}`}>
      <Mark className="size-[1.15em]" />
      {appName}
    </span>
  );
}
