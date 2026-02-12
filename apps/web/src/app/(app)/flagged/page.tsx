'use client';

import { useEffect } from 'react';
import { FlaggedList } from '@/components/FlaggedList';
import { useAppStore } from '@/stores/app.store';

export default function FlaggedPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('flagged');
  }, [setCurrentPerspective]);

  return <FlaggedList />;
}
