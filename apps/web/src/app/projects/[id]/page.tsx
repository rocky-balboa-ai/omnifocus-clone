'use client';

import { use } from 'react';
import { AppShell } from '@/components/AppShell';
import { ProjectDetailView } from '@/components/ProjectDetailView';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AppShell>
      <ProjectDetailView projectId={id} />
    </AppShell>
  );
}
