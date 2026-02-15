'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NavLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Reliable navigation link. Uses router.push with a fallback
 * to window.location.href if client-side routing fails.
 */
export function NavLink({ href, className, children, onClick }: NavLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      onClick?.(e);

      try {
        router.push(href);
        const currentPath = window.location.pathname;
        setTimeout(() => {
          if (window.location.pathname === currentPath && currentPath !== href) {
            window.location.href = href;
          }
        }, 150);
      } catch {
        window.location.href = href;
      }
    },
    [href, router, onClick],
  );

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
