'use client';

import { useState } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { ActionContextMenu } from './ActionContextMenu';
import { Circle, CheckCircle2, Flag, Calendar, Clock, PauseCircle, Bot, User } from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday, isFuture } from 'date-fns';

// Rocky status colors
const rockyStatusColors: Record<string, string> = {
  inbox: 'bg-gray-500',
  todo: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  waiting_on_fred: 'bg-orange-500',
  waiting_external: 'bg-purple-500',
  done: 'bg-green-500',
  dropped: 'bg-red-500',
};

// Rocky status labels
const rockyStatusLabels: Record<string, string> = {
  inbox: 'Inbox',
  todo: 'To Do',
  in_progress: 'In Progress',
  waiting_on_fred: 'Waiting on Fred',
  waiting_external: 'Waiting External',
  done: 'Done',
  dropped: 'Dropped',
};

// Category colors
const categoryColors: Record<string, string> = {
  bills: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  documents: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  household: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  family: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  errands: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  finance: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

interface ActionItemProps {
  action: Action;
}

export function ActionItem({ action }: ActionItemProps) {
  const { completeAction, setSelectedAction, selectedActionId, theme } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const isSelected = selectedActionId === action.id;
  const isDueSoon = action.dueDate && (isToday(new Date(action.dueDate)) || isPast(new Date(action.dueDate)));
  const isDeferred = action.deferDate && isFuture(new Date(action.deferDate));

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeAction(action.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
    <li
      onClick={() => setSelectedAction(action.id)}
      onContextMenu={handleContextMenu}
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
          {/* Managed By Badge */}
          {action.managedBy && (
            <span
              className={clsx(
                'flex items-center justify-center w-5 h-5 rounded-full',
                action.managedBy === 'rocky'
                  ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              )}
              title={action.managedBy === 'rocky' ? 'Managed by Rocky' : 'Managed by Fred'}
            >
              {action.managedBy === 'rocky' ? <Bot size={12} /> : <User size={12} />}
            </span>
          )}
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
          {/* Priority Badge */}
          {action.priority && (
            <span
              className={clsx(
                'px-1.5 py-0.5 text-xs font-medium rounded',
                action.priority === 'high' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                action.priority === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                action.priority === 'low' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              {action.priority.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {/* Rocky Status Pill */}
          {action.rockyStatus && action.rockyStatus !== 'inbox' && (
            <span
              className={clsx(
                'px-2 py-0.5 rounded-full text-white text-[10px] font-medium uppercase tracking-wide',
                rockyStatusColors[action.rockyStatus] || 'bg-gray-500'
              )}
            >
              {rockyStatusLabels[action.rockyStatus] || action.rockyStatus}
            </span>
          )}

          {/* Category Tag */}
          {action.category && (
            <span
              className={clsx(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                categoryColors[action.category] || categoryColors.other
              )}
            >
              {action.category}
            </span>
          )}

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

    {contextMenu && (
      <ActionContextMenu
        action={action}
        position={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    )}
    </>
  );
}
