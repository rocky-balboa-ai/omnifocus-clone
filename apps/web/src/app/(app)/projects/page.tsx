'use client';

import { useEffect } from 'react';
import { ProjectList } from '@/components/ProjectList';
import { useAppStore } from '@/stores/app.store';

export default function ProjectsPage() {
  const setCurrentPerspective = useAppStore(s => s.setCurrentPerspective);

  useEffect(() => {
    setCurrentPerspective('projects');
  }, [setCurrentPerspective]);

  return <ProjectList />;
}
