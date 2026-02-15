'use client';

import Link from 'next/link';

/**
 * Minimal AppShell — for debugging navigation.
 * Strips out ALL hooks and store usage to isolate the issue.
 */
export function AppShellMinimal({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e', color: '#fff' }}>
      {/* Minimal sidebar */}
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
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {children}
      </main>
    </div>
  );
}
