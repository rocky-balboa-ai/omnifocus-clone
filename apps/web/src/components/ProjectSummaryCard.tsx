'use client';

import { useMemo } from 'react';
import { useAppStore, Project } from '@/stores/app.store';
import {
  FolderKanban,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Flag,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import clsx from 'clsx';

interface ProjectSummaryCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectSummaryCard({ project, onClick }: ProjectSummaryCardProps) {
  const { theme, actions, setSelectedProject } = useAppStore();

  const stats = useMemo(() => {
    const projectActions = actions.filter(a => a.projectId === project.id);
    const completed = projectActions.filter(a => a.status === 'completed').length;
    const total = projectActions.length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdueCount = projectActions.filter(
      a => a.status === 'active' && a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))
    ).length;
    const dueTodayCount = projectActions.filter(
      a => a.status === 'active' && a.dueDate && isToday(new Date(a.dueDate))
    ).length;

    // Get next action
    const nextAction = projectActions.find(a => a.status === 'active');

    return { completed, total, remaining, percentage, overdueCount, dueTodayCount, nextAction };
  }, [actions, project.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setSelectedProject(project.id);
    }
  };

  const getStatusColor = () => {
    if (stats.overdueCount > 0) return 'text-red-500';
    if (stats.dueTodayCount > 0) return 'text-omnifocus-orange';
    if (stats.percentage === 100) return 'text-green-500';
    return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full p-4 rounded-xl border text-left transition-all group',
        theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-border hover:border-omnifocus-purple'
          : 'bg-white border-gray-200 hover:border-omnifocus-purple hover:shadow-sm'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FolderKanban size={16} className="text-omnifocus-purple shrink-0" />
          <h4 className={clsx(
            'font-medium truncate',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {project.name}
          </h4>
          {project.flagged && (
            <Flag size={12} className="text-omnifocus-orange shrink-0" />
          )}
        </div>
        <ChevronRight
          size={16}
          className={clsx(
            'shrink-0 transition-transform group-hover:translate-x-0.5',
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          )}
        />
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            Progress
          </span>
          <span className={clsx('text-xs font-medium', getStatusColor())}>
            {stats.completed}/{stats.total}
          </span>
        </div>
        <div className={clsx(
          'h-1.5 rounded-full overflow-hidden',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
        )}>
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              stats.percentage === 100 ? 'bg-green-500' :
              stats.overdueCount > 0 ? 'bg-red-500' :
              'bg-omnifocus-purple'
            )}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-3 mb-3">
        {stats.remaining > 0 && (
          <div className="flex items-center gap-1">
            <Circle size={12} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {stats.remaining} remaining
            </span>
          </div>
        )}
        {stats.overdueCount > 0 && (
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-red-500" />
            <span className="text-xs text-red-500">
              {stats.overdueCount} overdue
            </span>
          </div>
        )}
        {stats.dueTodayCount > 0 && (
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-omnifocus-orange" />
            <span className="text-xs text-omnifocus-orange">
              {stats.dueTodayCount} today
            </span>
          </div>
        )}
        {stats.percentage === 100 && (
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" />
            <span className="text-xs text-green-500">
              Complete
            </span>
          </div>
        )}
      </div>

      {/* Next Action */}
      {stats.nextAction && (
        <div className={clsx(
          'pt-2 border-t text-xs',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-100'
        )}>
          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
            Next:
          </span>{' '}
          <span className={clsx(
            'truncate',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>
            {stats.nextAction.title}
          </span>
        </div>
      )}

      {/* Due Date */}
      {project.dueDate && (
        <div className={clsx(
          'mt-2 text-xs',
          isPast(new Date(project.dueDate)) && !isToday(new Date(project.dueDate))
            ? 'text-red-500'
            : isToday(new Date(project.dueDate))
              ? 'text-omnifocus-orange'
              : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          Due {format(new Date(project.dueDate), 'MMM d')}
        </div>
      )}
    </button>
  );
}

// Grid of project summary cards
interface ProjectSummaryGridProps {
  maxProjects?: number;
}

export function ProjectSummaryGrid({ maxProjects = 4 }: ProjectSummaryGridProps) {
  const { projects, theme } = useAppStore();

  // Get active projects sorted by urgency
  const activeProjects = useMemo(() => {
    return projects
      .filter(p => p.status === 'active')
      .sort((a, b) => {
        // Prioritize flagged
        if (a.flagged && !b.flagged) return -1;
        if (!a.flagged && b.flagged) return 1;
        // Then by due date
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, maxProjects);
  }, [projects, maxProjects]);

  if (activeProjects.length === 0) {
    return null;
  }

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface/50 border-omnifocus-border'
        : 'bg-gray-50 border-gray-200'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <FolderKanban size={18} className="text-omnifocus-purple" />
        <h3 className={clsx(
          'text-sm font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Active Projects
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeProjects.map(project => (
          <ProjectSummaryCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
