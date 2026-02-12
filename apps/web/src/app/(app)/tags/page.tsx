'use client';

import { useEffect } from 'react';
import { TagList } from '@/components/TagList';
import { useAppStore } from '@/stores/app.store';

export default function TagsPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('tags');
  }, [setCurrentPerspective]);

  return <TagList />;
}
