'use client';

import { useEffect } from 'react';
import { ReviewList } from '@/components/ReviewList';
import { useAppStore } from '@/stores/app.store';

export default function ReviewPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('review');
  }, [setCurrentPerspective]);

  return <ReviewList />;
}
