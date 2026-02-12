'use client';

import { useEffect } from 'react';
import { RockyQueueList } from '@/components/RockyQueueList';
import { useAppStore } from '@/stores/app.store';

export default function RockyQueuePage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('rocky-queue');
  }, [setCurrentPerspective]);

  return <RockyQueueList />;
}
