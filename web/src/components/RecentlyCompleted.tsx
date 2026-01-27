'use client';

import { useMemo, useState } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Undo2 } from 'lucide-react';
import clsx from 'clsx';
import { format, isToday, isYesterday, isThisWeek, subDays } from 'date-fns';

interface RecentlyCompletedProps {
  maxItems?: number;
}

export function RecentlyCompleted({ maxItems = 10 }: RecentlyCompletedProps) {
  const { actions, theme, uncompleteAction, projects } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const recentlyCompleted = useMemo(() => {
    const completed = actions
      .filter(a => a.status === 'completed' && a.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt!).getTime();
        const dateB = new Date(b.completedAt!).getTime();
        return dateB - dateA;
      })
      .slice(0, maxItems);

    return completed;
  }, [actions, maxItems]);

  const groupedByDate = useMemo(() => {
    const groups: { label: string; actions: Action[] }[] = [];
    const todayActions: Action[] = [];
    const yesterdayActions: Action[] = [];
    const thisWeekActions: Action[] = [];
    const olderActions: Action[] = [];

    recentlyCompleted.forEach(action => {
      const date = new Date(action.completedAt!);
      if (isToday(date)) {
        todayActions.push(action);
      } else if (isYesterday(date)) {
        yesterdayActions.push(action);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        thisWeekActions.push(action);
      } else {
        olderActions.push(action);
      }
    });

    if (todayActions.length > 0) groups.push({ label: 'Today', actions: todayActions });
    if (yesterdayActions.length > 0) groups.push({ label: 'Yesterday', actions: yesterdayActions });
    if (thisWeekActions.length > 0) groups.push({ label: 'This Week', actions: thisWeekActions });
    if (olderActions.length > 0) groups.push({ label: 'Earlier', actions: olderActions });

    return groups;
  }, [recentlyCompleted]);

  const handleUncomplete = async (actionId: string) => {
    await uncompleteAction(actionId);
  };

  if (recentlyCompleted.length === 0) {
    return null;
  }

  const displayedItems = isExpanded ? groupedByDate : groupedByDate.slice(0, 1);
  const hasMore = groupedByDate.length > 1 || (groupedByDate[0]?.actions.length || 0) > 3;

  return (
    <div className={clsx(
      'rounded-lg border overflow-hidden',
      theme === 'dark'
        ? 'bg-omnifocus-surface/50 border-omnifocus-border'
        : 'bg-gray-50 border-gray-200'
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3 transition-colors',
          theme === 'dark'
            ? 'hover:bg-omnifocus-surface'
            : 'hover:bg-gray-100'
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" />
          <span className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Recently Completed
          </span>
          <span className={clsx(
            'px-1.5 py-0.5 rounded text-xs',
            theme === 'dark'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-green-100 text-green-700'
          )}>
            {recentlyCompleted.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>

      {/* Content */}
      <div className={clsx(
        'border-t',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        {displayedItems.map((group, groupIndex) => (
          <div key={group.label}>
            {/* Group label */}
            <div className={clsx(
              'px-4 py-1.5 text-xs font-medium uppercase tracking-wider',
              theme === 'dark' ? 'text-gray-500 bg-omnifocus-bg/50' : 'text-gray-400 bg-gray-100'
            )}>
              {group.label}
            </div>

            {/* Actions */}
            {(isExpanded ? group.actions : group.actions.slice(0, 3)).map((action) => {
              const project = projects.find(p => p.id === action.projectId);
              return (
                <div
                  key={action.id}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2 group',
                    theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100'
                  )}
                >
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm line-through truncate',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      {action.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {project && <span>{project.name}</span>}
                      {action.completedAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {format(new Date(action.completedAt), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUncomplete(action.id)}
                    className={clsx(
                      'opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all',
                      theme === 'dark'
                        ? 'hover:bg-omnifocus-border text-gray-500 hover:text-white'
                        : 'hover:bg-gray-200 text-gray-400 hover:text-gray-700'
                    )}
                    title="Undo completion"
                  >
                    <Undo2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {/* Show more/less button */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={clsx(
              'w-full py-2 text-xs text-center transition-colors',
              theme === 'dark'
                ? 'text-gray-500 hover:text-gray-300 hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            )}
          >
            {isExpanded ? 'Show less' : `Show ${recentlyCompleted.length - 3} more`}
          </button>
        )}
      </div>
    </div>
  );
}
