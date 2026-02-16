'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { LoginForm } from '@/components/LoginForm';
import { useAppStore, derivePerspectiveFromPath } from '@/stores/app.store';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { useThemeInit } from '@/lib/useThemeInit';
import { useNotifications } from '@/lib/useNotifications';
import { useTaskUrlSync } from '@/lib/useTaskUrlSync';
import clsx from 'clsx';

/**
 * Debugging AppShell — real Sidebar + BottomNav, NO overlays/modals.
 * Testing if nav components or overlay components kill navigation.
 */
export function AppShellMinimal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isAuthenticated,
    setAuthenticated,
    checkAuth,
    fetchPerspectives,
    fetchActions,
    fetchProjects,
    fetchTags,
    fetchFolders,
    currentPerspective,
    setCurrentPerspective,
    theme,
    isFocusMode,
  } = useAppStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    const p = derivePerspectiveFromPath(pathname);
    setCurrentPerspective(p);
  }, [pathname, setCurrentPerspective]);

  useThemeInit();
  useKeyboardShortcuts();
  useNotifications();
  useTaskUrlSync();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPerspectives();
      fetchProjects();
      fetchTags();
      fetchFolders();
    }
  }, [isAuthenticated, fetchPerspectives, fetchProjects, fetchTags, fetchFolders]);

  useEffect(() => {
    if (isAuthenticated && currentPerspective) {
      fetchActions(currentPerspective);
    }
  }, [isAuthenticated, currentPerspective, fetchActions]);

  const handleLoginSuccess = (user: { id: string; username: string }) => {
    setAuthenticated(true, user);
  };

  if (!isAuthenticated) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={clsx(
      'flex h-screen',
      theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-omnifocus-light-bg'
    )}>
      {!isFocusMode && <Sidebar />}

      <main className="flex-1 overflow-hidden pb-16 md:pb-0 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
