'use client';

import { useEffect } from 'react';
import { ForecastList } from '@/components/ForecastList';
import { useAppStore } from '@/stores/app.store';

export default function ForecastPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('forecast');
  }, [setCurrentPerspective]);

  return <ForecastList />;
}
