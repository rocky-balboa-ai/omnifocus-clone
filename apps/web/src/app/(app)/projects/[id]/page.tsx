'use client';

import { use } from 'react';
import { ProjectDetailView } from '@/components/ProjectDetailView';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <ProjectDetailView projectId={id} />;
}
