'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app.store';

/**
 * Syncs selectedActionId with ?task= URL query parameter.
 * - On mount: reads ?task= and opens the detail panel
 * - On selection: updates URL with ?task=<id>
 * - On close: removes ?task= from URL
 */
export function useTaskUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedActionId = useAppStore(s => s.selectedActionId);
  const setSelectedAction = useAppStore(s => s.setSelectedAction);
  const initializedRef = useRef(false);
  const prevPathnameRef = useRef(pathname);
  const isNavigatingRef = useRef(false);

  // On mount: read ?task= from URL and open detail panel
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const taskId = searchParams.get('task');
    if (taskId) {
      setSelectedAction(taskId);
    }
  }, [searchParams, setSelectedAction]);

  // Detect page navigations and suppress URL sync during transitions
  // to avoid router.replace() conflicting with an in-flight router.push()
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      isNavigatingRef.current = true;
      prevPathnameRef.current = pathname;
      const timer = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // When selectedActionId changes, update URL
  useEffect(() => {
    // Don't interfere with an active page navigation
    if (isNavigatingRef.current) return;

    const currentTaskParam = searchParams.get('task');

    if (selectedActionId && selectedActionId !== currentTaskParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('task', selectedActionId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else if (!selectedActionId && currentTaskParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('task');
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }
  }, [selectedActionId, searchParams, router, pathname]);
}
