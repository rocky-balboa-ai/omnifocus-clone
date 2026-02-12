'use client';

import { useEffect } from 'react';
import { StatsDashboard } from '@/components/StatsDashboard';
import { useAppStore } from '@/stores/app.store';

export default function StatsPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('stats');
  }, [setCurrentPerspective]);

  return <StatsDashboard />;
}
