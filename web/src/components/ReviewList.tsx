'use client';

import { useMemo } from 'react';
import { useAppStore, Project } from '@/stores/app.store';
import {
  RefreshCw,
  Check,
  ChevronRight,
  Calendar,
  FolderKanban,
  Layers,
  List,
} from 'lucide-react';
import clsx from 'clsx';
import { format, isBefore, startOfDay } from 'date-fns';

interface ReviewProjectItemProps {
  project: Project;
  onReview: (id: string) => void;
  onSelect: (id: string) => void;
}

function ReviewProjectItem({ project, onReview, onSelect }: ReviewProjectItemProps) {
  const isOverdue = project.nextReviewAt && isBefore(new Date(project.nextReviewAt), startOfDay(new Date()));

  const typeIcon = project.type === 'sequential' ? List : project.type === 'parallel' ? Layers : FolderKanban;
  const TypeIcon = typeIcon;

  return (
    <li className="flex items-center gap-3 p-3 rounded-lg bg-omnifocus-surface border border-omnifocus-border">
      <TypeIcon size={18} className="text-blue-400 shrink-0" />

      <div className="flex-1 min-w-0">
        <button
          onClick={() => onSelect(project.id)}
          className="text-sm text-white hover:text-omnifocus-purple transition-colors text-left"
        >
          {project.name}
        </button>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{project._count?.actions || 0} actions</span>
          {project.nextReviewAt && (
            <span className={clsx(
              'flex items-center gap-1',
              isOverdue && 'text-red-400'
            )}>
              <Calendar size={12} />
              Review: {format(new Date(project.nextReviewAt), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onReview(project.id)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors text-sm"
      >
        <Check size={16} />
        <span className="hidden md:inline">Mark Reviewed</span>
      </button>

      <button
        onClick={() => onSelect(project.id)}
        className="p-2 rounded-lg hover:bg-omnifocus-border text-gray-400 hover:text-white transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </li>
  );
}

export function ReviewList() {
  const { projects, isLoading, setSelectedProject, updateProject } = useAppStore();

  // Filter to projects that need review
  const projectsToReview = useMemo(() => {
    const today = startOfDay(new Date());

    return projects.filter(p => {
      if (p.status !== 'active') return false;
      if (!p.reviewInterval) return false;

      // Include if never reviewed or next review is today or past
      if (!p.nextReviewAt) return true;
      return isBefore(new Date(p.nextReviewAt), today) || format(new Date(p.nextReviewAt), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    }).sort((a, b) => {
      // Sort overdue first
      if (a.nextReviewAt && b.nextReviewAt) {
        return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
      }
      if (!a.nextReviewAt) return -1;
      if (!b.nextReviewAt) return 1;
      return 0;
    });
  }, [projects]);

  const handleMarkReviewed = async (projectId: string) => {
    // Calculate next review date based on interval
    const project = projects.find(p => p.id === projectId);
    if (!project?.reviewInterval) return;

    const interval = project.reviewInterval;
    const now = new Date();
    let nextReview = new Date();

    // Parse interval like "1w", "2w", "1m", "3m", "1y"
    const match = interval.match(/^(\d+)([dwmy])$/);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'd':
          nextReview.setDate(now.getDate() + amount);
          break;
        case 'w':
          nextReview.setDate(now.getDate() + amount * 7);
          break;
        case 'm':
          nextReview.setMonth(now.getMonth() + amount);
          break;
        case 'y':
          nextReview.setFullYear(now.getFullYear() + amount);
          break;
      }
    }

    await updateProject(projectId, {
      nextReviewAt: nextReview.toISOString(),
    } as any);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-omnifocus-border safe-area-top flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw size={24} className="text-green-400" />
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Review
          </h2>
        </div>

        {projectsToReview.length > 0 && (
          <span className="text-sm text-gray-400">
            {projectsToReview.length} project{projectsToReview.length !== 1 ? 's' : ''} to review
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {projectsToReview.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">All caught up!</p>
            <p className="text-sm text-gray-600 mt-1">
              No projects need review right now
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {projectsToReview.map(project => (
              <ReviewProjectItem
                key={project.id}
                project={project}
                onReview={handleMarkReviewed}
                onSelect={(id) => setSelectedProject(id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
