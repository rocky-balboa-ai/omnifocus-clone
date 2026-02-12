'use client';

import { AppShell } from '@/components/AppShell';
import { ActionList } from '@/components/ActionList';
import { ProjectList } from '@/components/ProjectList';
import { TagList } from '@/components/TagList';
import { ForecastList } from '@/components/ForecastList';
import { FlaggedList } from '@/components/FlaggedList';
import { ReviewList } from '@/components/ReviewList';
import { TodayDashboard } from '@/components/TodayDashboard';
import { StatsDashboard } from '@/components/StatsDashboard';
import { RockyQueueList } from '@/components/RockyQueueList';
import { useAppStore } from '@/stores/app.store';

function PerspectiveContent() {
  const { currentPerspective } = useAppStore();

  if (currentPerspective === 'projects') return <ProjectList />;
  if (currentPerspective === 'tags') return <TagList />;
  if (currentPerspective === 'forecast') return <ForecastList />;
  if (currentPerspective === 'flagged') return <FlaggedList />;
  if (currentPerspective === 'review') return <ReviewList />;
  if (currentPerspective === 'today') return <TodayDashboard />;
  if (currentPerspective === 'stats') return <StatsDashboard />;
  if (currentPerspective === 'rocky-queue') return <RockyQueueList />;
  return <ActionList />;
}

export default function Home() {
  return (
    <AppShell>
      <PerspectiveContent />
    </AppShell>
  );
}
