'use client';

import { useAppStore, Project } from '@/stores/app.store';
import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const STALLED_THRESHOLD_DAYS = 14;

/**
 * Check if a project is stalled (no activity in 14+ days and has remaining actions)
 */
export function isProjectStalled(project: Project): boolean {
  // Only active projects can be stalled
  if (project.status !== 'active') return false;

  // Check if project has remaining (incomplete) actions
  const totalActions = project._count?.actions || 0;
  const completedActions = project._count?.completedActions || 0;
  const remainingActions = totalActions - completedActions;

  if (remainingActions <= 0) return false;

  // Check if project hasn't been updated in 14+ days
  const lastUpdate = new Date(project.updatedAt);
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceUpdate >= STALLED_THRESHOLD_DAYS;
}

/**
 * Get the number of days since last update
 */
export function getDaysSinceUpdate(project: Project): number {
  const lastUpdate = new Date(project.updatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
}

interface StalledIndicatorProps {
  project: Project;
}

export function StalledIndicator({ project }: StalledIndicatorProps) {
  const { theme } = useAppStore();

  if (!isProjectStalled(project)) {
    return null;
  }

  const days = getDaysSinceUpdate(project);

  return (
    <span
      title={`Stalled - no activity in ${days} days`}
      className={clsx(
        'inline-flex items-center shrink-0',
        theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'
      )}
    >
      <AlertTriangle size={14} />
    </span>
  );
}
