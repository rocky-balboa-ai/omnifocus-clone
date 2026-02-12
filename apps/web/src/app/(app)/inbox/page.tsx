'use client';

import { useEffect } from 'react';
import { ActionList } from '@/components/ActionList';
import { useAppStore } from '@/stores/app.store';

export default function InboxPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('inbox');
  }, [setCurrentPerspective]);

  return <ActionList />;
}
