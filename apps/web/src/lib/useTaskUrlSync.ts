'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app.store';

/**
 * Syncs selectedActionId with ?task= URL query parameter.
 * Uses history.replaceState instead of router.replace to avoid
 * interfering with Next.js router transitions.
 */
export function useTaskUrlSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedActionId = useAppStore(s => s.selectedActionId);
  const setSelectedAction = useAppStore(s => s.setSelectedAction);
  const initializedRef = useRef(false);

  // On mount: read ?task= from URL and open detail panel
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const taskId = searchParams.get('task');
    if (taskId) {
      setSelectedAction(taskId);
    }
  }, [searchParams, setSelectedAction]);

  // When selectedActionId changes, update URL without touching the router
  useEffect(() => {
    const currentTaskParam = new URLSearchParams(window.location.search).get('task');

    if (selectedActionId && selectedActionId !== currentTaskParam) {
      const params = new URLSearchParams(window.location.search);
      params.set('task', selectedActionId);
      window.history.replaceState(
        window.history.state,
        '',
        `${pathname}?${params.toString()}`
      );
    } else if (!selectedActionId && currentTaskParam) {
      const params = new URLSearchParams(window.location.search);
      params.delete('task');
      const queryString = params.toString();
      window.history.replaceState(
        window.history.state,
        '',
        queryString ? `${pathname}?${queryString}` : pathname
      );
    }
  }, [selectedActionId, pathname]);
}
