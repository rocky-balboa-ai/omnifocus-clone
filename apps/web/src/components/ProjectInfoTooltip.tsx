'use client';

import { useMemo } from 'react';
import { useAppStore, Project } from '@/stores/app.store';
import { FolderKanban, Calendar, Flag, Layers, List, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday } from 'date-fns';

interface ProjectInfoTooltipProps {
  project: Project;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function ProjectInfoTooltip({ project, position = 'top' }: ProjectInfoTooltipProps) {
  const { theme, actions } = useAppStore();

  const projectActions = useMemo(() =>
    actions.filter(a => a.projectId === project.id),
    [actions, project.id]
  );

  const stats = useMemo(() => {
    const active = projectActions.filter(a => a.status === 'active').length;
    const completed = projectActions.filter(a => a.status === 'completed').length;
    const total = projectActions.length;
    const overdue = projectActions.filter(a =>
      a.status === 'active' && a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))
    ).length;
    const dueToday = projectActions.filter(a =>
      a.status === 'active' && a.dueDate && isToday(new Date(a.dueDate))
    ).length;

    return { active, completed, total, overdue, dueToday };
  }, [projectActions]);

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const TypeIcon = project.type === 'sequential' ? List : project.type === 'parallel' ? Layers : FolderKanban;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={clsx(
      'absolute z-50 w-64 p-3 rounded-lg shadow-xl border animate-fade-in',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar border-omnifocus-border'
        : 'bg-white border-gray-200',
      positionClasses[position]
    )}>
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <TypeIcon size={18} className="text-blue-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className={clsx(
            'font-medium truncate',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {project.name}
          </h4>
          <p className="text-xs text-gray-500 capitalize">{project.type.replace('_', ' ')} project</p>
        </div>
        {project.flagged && <Flag size={14} className="text-omnifocus-orange shrink-0" />}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            Progress
          </span>
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            {progressPercent}%
          </span>
        </div>
        <div className={clsx(
          'h-2 rounded-full overflow-hidden',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
        )}>
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              progressPercent === 100 ? 'bg-green-500' : 'bg-omnifocus-purple'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={clsx(
          'flex items-center gap-2 p-2 rounded',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
        )}>
          <Circle size={12} className="text-blue-400" />
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            {stats.active} remaining
          </span>
        </div>
        <div className={clsx(
          'flex items-center gap-2 p-2 rounded',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
        )}>
          <CheckCircle2 size={12} className="text-green-500" />
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            {stats.completed} done
          </span>
        </div>
        {stats.overdue > 0 && (
          <div className={clsx(
            'flex items-center gap-2 p-2 rounded col-span-2',
            'bg-red-500/10'
          )}>
            <Calendar size={12} className="text-red-400" />
            <span className="text-red-400">
              {stats.overdue} overdue
            </span>
          </div>
        )}
        {stats.dueToday > 0 && (
          <div className={clsx(
            'flex items-center gap-2 p-2 rounded col-span-2',
            'bg-omnifocus-orange/10'
          )}>
            <Calendar size={12} className="text-omnifocus-orange" />
            <span className="text-omnifocus-orange">
              {stats.dueToday} due today
            </span>
          </div>
        )}
      </div>

      {/* Due Date */}
      {project.dueDate && (
        <div className={clsx(
          'mt-3 pt-3 border-t flex items-center gap-2 text-xs',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <Calendar size={12} className={isPast(new Date(project.dueDate)) ? 'text-red-400' : 'text-gray-400'} />
          <span className={isPast(new Date(project.dueDate)) ? 'text-red-400' : 'text-gray-500'}>
            Due {format(new Date(project.dueDate), 'MMM d, yyyy')}
          </span>
        </div>
      )}

      {/* Note preview */}
      {project.note && (
        <div className={clsx(
          'mt-3 pt-3 border-t',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <p className={clsx(
            'text-xs line-clamp-2',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {project.note}
          </p>
        </div>
      )}
    </div>
  );
}
