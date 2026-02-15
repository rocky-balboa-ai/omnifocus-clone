'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NavLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A reliable navigation link that works around Next.js App Router
 * client-side routing issues. Uses <a> tag with onClick handler
 * that prevents default and navigates via window.location for
 * cross-route navigation.
 */
export function NavLink({ href, className, children }: NavLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow modified clicks (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();

      // Use soft navigation first, fall back to hard nav
      try {
        router.push(href);
        // If router.push doesn't change URL within 100ms, force navigation
        const currentUrl = window.location.pathname;
        setTimeout(() => {
          if (window.location.pathname === currentUrl && currentUrl !== href) {
            window.location.href = href;
          }
        }, 150);
      } catch {
        window.location.href = href;
      }
    },
    [href, router],
  );

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
