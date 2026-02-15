'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore, derivePerspectiveFromPath } from '@/stores/app.store';

/**
 * Iterative debugging AppShell — adding hooks one by one.
 * Currently testing: useAppStore + checkAuth + perspective sync + data fetching
 */
export function AppShellMinimal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isAuthenticated,
    checkAuth,
    fetchPerspectives,
    fetchActions,
    fetchProjects,
    fetchTags,
    fetchFolders,
    currentPerspective,
    setCurrentPerspective,
  } = useAppStore();

  // Effect 1: Check auth
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Effect 2: Sync perspective from URL
  useEffect(() => {
    const perspectiveFromUrl = derivePerspectiveFromPath(pathname);
    setCurrentPerspective(perspectiveFromUrl);
  }, [pathname, setCurrentPerspective]);

  // Effect 3: Fetch initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchPerspectives();
      fetchProjects();
      fetchTags();
      fetchFolders();
    }
  }, [isAuthenticated, fetchPerspectives, fetchProjects, fetchTags, fetchFolders]);

  // Effect 4: Fetch actions when perspective changes
  useEffect(() => {
    if (isAuthenticated && currentPerspective) {
      fetchActions(currentPerspective);
    }
  }, [isAuthenticated, currentPerspective, fetchActions]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e', color: '#fff' }}>
      <aside style={{ width: 200, borderRight: '1px solid #333', padding: 16 }}>
        <h2>Nav</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/inbox" style={{ color: '#8B5CF6' }}>Inbox</Link>
          <Link href="/today" style={{ color: '#8B5CF6' }}>Today</Link>
          <Link href="/projects" style={{ color: '#8B5CF6' }}>Projects</Link>
          <Link href="/forecast" style={{ color: '#8B5CF6' }}>Forecast</Link>
          <Link href="/flagged" style={{ color: '#8B5CF6' }}>Flagged</Link>
          <Link href="/tags" style={{ color: '#8B5CF6' }}>Tags</Link>
          <Link href="/review" style={{ color: '#8B5CF6' }}>Review</Link>
          <Link href="/test" style={{ color: '#8B5CF6' }}>Test</Link>
        </nav>
        <p style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
          Auth: {isAuthenticated ? '✅' : '❌'} | Perspective: {currentPerspective || 'none'}
        </p>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {children}
      </main>
    </div>
  );
}
