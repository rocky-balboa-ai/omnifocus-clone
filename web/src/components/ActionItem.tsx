'use client';

import { useAppStore, Action } from '@/stores/app.store';
import { Circle, CheckCircle2, Flag, Calendar, Clock, PauseCircle } from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday, isFuture } from 'date-fns';

interface ActionItemProps {
  action: Action;
}

export function ActionItem({ action }: ActionItemProps) {
  const { completeAction, setSelectedAction, selectedActionId, theme } = useAppStore();

  const isSelected = selectedActionId === action.id;
  const isDueSoon = action.dueDate && (isToday(new Date(action.dueDate)) || isPast(new Date(action.dueDate)));
  const isDeferred = action.deferDate && isFuture(new Date(action.deferDate));

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeAction(action.id);
  };

  return (
    <li
      onClick={() => setSelectedAction(action.id)}
      className={clsx(
        'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-omnifocus-purple/20 border border-omnifocus-purple'
          : theme === 'dark'
            ? 'hover:bg-omnifocus-surface border border-transparent'
            : 'hover:bg-gray-100 border border-transparent'
      )}
    >
      <button
        onClick={handleComplete}
        className={clsx(
          'mt-0.5 hover:text-omnifocus-purple transition-colors',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}
      >
        {action.status === 'completed' ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'text-sm',
              action.status === 'completed'
                ? 'line-through text-gray-500'
                : theme === 'dark' ? 'text-white' : 'text-gray-900',
              isDeferred && (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
            )}
          >
            {action.title}
          </span>
          {action.flagged && <Flag size={14} className="text-omnifocus-orange" />}
          {isDeferred && (
            <span className="flex items-center gap-1 text-xs text-omnifocus-orange" title={`Available ${format(new Date(action.deferDate!), 'MMM d')}`}>
              <PauseCircle size={14} />
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {action.project && (
            <span className="truncate">{action.project.name}</span>
          )}

          {isDeferred && (
            <span className="flex items-center gap-1 text-omnifocus-orange">
              <PauseCircle size={12} />
              {format(new Date(action.deferDate!), 'MMM d')}
            </span>
          )}

          {action.dueDate && (
            <span
              className={clsx(
                'flex items-center gap-1',
                isDueSoon && 'text-red-400'
              )}
            >
              <Calendar size={12} />
              {format(new Date(action.dueDate), 'MMM d')}
            </span>
          )}

          {action.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {action.estimatedMinutes}m
            </span>
          )}

          {action.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {action.tags.slice(0, 2).map(({ tag }) => (
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
              {action.tags.length > 2 && (
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>+{action.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
