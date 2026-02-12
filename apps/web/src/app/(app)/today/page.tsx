'use client';

import { useEffect } from 'react';
import { TodayDashboard } from '@/components/TodayDashboard';
import { useAppStore } from '@/stores/app.store';

export default function TodayPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('today');
  }, [setCurrentPerspective]);

  return <TodayDashboard />;
}
