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

  // On mount: read ?task= from URL and open detail panel
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const taskId = searchParams.get('task');
    if (taskId) {
      setSelectedAction(taskId);
    }
  }, [searchParams, setSelectedAction]);

  // When selectedActionId changes, update URL
  useEffect(() => {
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
