'use client';

import { useAppStore, Action } from '@/stores/app.store';
import {
  Calendar,
  Flag,
  FolderKanban,
  Tag,
  Clock,
  Repeat,
  PauseCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, isBefore, startOfDay } from 'date-fns';
import clsx from 'clsx';

interface TaskPreviewProps {
  action: Action;
  className?: string;
}

export function TaskPreview({ action, className }: TaskPreviewProps) {
  const { theme, projects, tags } = useAppStore();

  const project = action.projectId
    ? projects.find(p => p.id === action.projectId)
    : null;

  const actionTags = action.tags?.map(({ tag }) => tag) || [];

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return `Overdue (${format(date, 'MMM d')})`;
    return format(date, 'MMM d, yyyy');
  };

  const isDeferred = action.deferDate &&
    isBefore(startOfDay(new Date()), new Date(action.deferDate));

  const isOverdue = action.dueDate &&
    isPast(new Date(action.dueDate)) &&
    !isToday(new Date(action.dueDate));

  return (
    <div className={clsx(
      'p-4 rounded-xl border shadow-lg min-w-[280px] max-w-[360px]',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar border-omnifocus-border'
        : 'bg-white border-gray-200',
      className
    )}>
      {/* Header with status indicators */}
      <div className="flex items-start gap-2 mb-3">
        {isOverdue && (
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
        )}
        {action.flagged && (
          <Flag size={16} className="text-omnifocus-orange shrink-0 mt-0.5" />
        )}
        {isDeferred && (
          <PauseCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
        )}
        <h4 className={clsx(
          'font-medium text-sm leading-snug flex-1',
          action.status === 'completed' && 'line-through opacity-60',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {action.title}
        </h4>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-xs">
        {/* Project */}
        {project && (
          <div className="flex items-center gap-2">
            <FolderKanban size={12} className="text-purple-500 shrink-0" />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {project.name}
            </span>
          </div>
        )}

        {/* Tags */}
        {actionTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-green-500 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {actionTags.map(tag => (
                <span
                  key={tag.id}
                  className={clsx(
                    'px-1.5 py-0.5 rounded',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Due Date */}
        {action.dueDate && (
          <div className="flex items-center gap-2">
            <Calendar
              size={12}
              className={clsx(
                'shrink-0',
                isOverdue ? 'text-red-500' : isToday(new Date(action.dueDate)) ? 'text-omnifocus-orange' : 'text-blue-500'
              )}
            />
            <span className={clsx(
              isOverdue ? 'text-red-500' : isToday(new Date(action.dueDate)) ? 'text-omnifocus-orange' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
            )}>
              {formatDueDate(action.dueDate)}
            </span>
          </div>
        )}

        {/* Defer Date */}
        {action.deferDate && (
          <div className="flex items-center gap-2">
            <PauseCircle
              size={12}
              className={clsx(
                'shrink-0',
                isDeferred ? 'text-yellow-500' : 'text-green-500'
              )}
            />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {isDeferred ? `Deferred until ${format(new Date(action.deferDate), 'MMM d')}` : 'Available now'}
            </span>
          </div>
        )}

        {/* Estimated Duration */}
        {action.estimatedMinutes && (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-blue-400 shrink-0" />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {action.estimatedMinutes >= 60
                ? `${Math.floor(action.estimatedMinutes / 60)}h ${action.estimatedMinutes % 60 > 0 ? `${action.estimatedMinutes % 60}m` : ''}`
                : `${action.estimatedMinutes}m`}
            </span>
          </div>
        )}

        {/* Recurrence */}
        {action.recurrence && (
          <div className="flex items-center gap-2">
            <Repeat size={12} className="text-purple-400 shrink-0" />
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {action.recurrence.frequency === 'daily' && `Every ${action.recurrence.interval === 1 ? 'day' : `${action.recurrence.interval} days`}`}
              {action.recurrence.frequency === 'weekly' && `Every ${action.recurrence.interval === 1 ? 'week' : `${action.recurrence.interval} weeks`}`}
              {action.recurrence.frequency === 'monthly' && `Every ${action.recurrence.interval === 1 ? 'month' : `${action.recurrence.interval} months`}`}
              {action.recurrence.frequency === 'yearly' && `Every ${action.recurrence.interval === 1 ? 'year' : `${action.recurrence.interval} years`}`}
            </span>
          </div>
        )}

        {/* Note preview */}
        {action.note && (
          <div className="flex items-start gap-2 pt-2 mt-2 border-t border-dashed">
            <FileText size={12} className={clsx(
              'shrink-0 mt-0.5',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )} />
            <p className={clsx(
              'line-clamp-2',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {action.note}
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      {action.status === 'completed' && action.completedAt && (
        <div className={clsx(
          'mt-3 pt-2 border-t text-xs',
          theme === 'dark' ? 'border-omnifocus-border text-green-500' : 'border-gray-200 text-green-600'
        )}>
          Completed {format(new Date(action.completedAt), 'MMM d, h:mm a')}
        </div>
      )}
    </div>
  );
}

// Hover wrapper for task preview
interface TaskPreviewHoverProps {
  action: Action;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function TaskPreviewHover({ action, children, position = 'right' }: TaskPreviewHoverProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group">
      {children}
      <div className={clsx(
        'absolute z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200',
        positionClasses[position]
      )}>
        <TaskPreview action={action} />
      </div>
    </div>
  );
}
