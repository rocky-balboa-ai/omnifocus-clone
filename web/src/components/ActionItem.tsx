'use client';

import { useAppStore, Action } from '@/stores/app.store';
import { Circle, CheckCircle2, Flag, Calendar, Clock } from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday } from 'date-fns';

interface ActionItemProps {
  action: Action;
}

export function ActionItem({ action }: ActionItemProps) {
  const { completeAction, setSelectedAction, selectedActionId } = useAppStore();

  const isSelected = selectedActionId === action.id;
  const isDueSoon = action.dueDate && (isToday(new Date(action.dueDate)) || isPast(new Date(action.dueDate)));

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
          : 'hover:bg-omnifocus-surface border border-transparent'
      )}
    >
      <button
        onClick={handleComplete}
        className="mt-0.5 text-gray-500 hover:text-omnifocus-purple transition-colors"
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
              action.status === 'completed' ? 'line-through text-gray-500' : 'text-white'
            )}
          >
            {action.title}
          </span>
          {action.flagged && <Flag size={14} className="text-omnifocus-orange" />}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {action.project && (
            <span className="truncate">{action.project.name}</span>
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
                  className="px-1.5 py-0.5 bg-omnifocus-surface rounded text-gray-400"
                >
                  {tag.name}
                </span>
              ))}
              {action.tags.length > 2 && (
                <span className="text-gray-500">+{action.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
