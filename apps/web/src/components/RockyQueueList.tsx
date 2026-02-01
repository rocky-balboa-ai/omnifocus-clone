'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { ActionItem } from './ActionItem';
import { api } from '@/lib/api';
import { Bot, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Rocky status order and labels
const rockyStatusOrder = [
  'in_progress',
  'todo',
  'waiting_on_fred',
  'waiting_external',
  'inbox',
  'done',
  'dropped',
];

const rockyStatusLabels: Record<string, string> = {
  inbox: 'Inbox',
  todo: 'To Do',
  in_progress: 'In Progress',
  waiting_on_fred: 'Waiting on Fred',
  waiting_external: 'Waiting External',
  done: 'Done',
  dropped: 'Dropped',
};

const rockyStatusColors: Record<string, string> = {
  inbox: 'bg-gray-500',
  todo: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  waiting_on_fred: 'bg-orange-500',
  waiting_external: 'bg-purple-500',
  done: 'bg-green-500',
  dropped: 'bg-red-500',
};

export function RockyQueueList() {
  const { theme } = useAppStore();
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['done', 'dropped']));

  // Fetch Rocky's tasks directly from API
  useEffect(() => {
    const fetchRockyTasks = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<Action[]>('/actions?managedBy=rocky');
        setActions(response);
      } catch (error) {
        console.error('Failed to fetch Rocky tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRockyTasks();
  }, []);

  // Group actions by rockyStatus
  const groupedActions = useMemo(() => {
    const groups: Record<string, Action[]> = {};

    // Initialize all groups
    rockyStatusOrder.forEach(status => {
      groups[status] = [];
    });

    // Sort actions into groups
    actions.forEach(action => {
      const status = action.rockyStatus || 'inbox';
      if (groups[status]) {
        groups[status].push(action);
      } else {
        groups['inbox'].push(action);
      }
    });

    return groups;
  }, [actions]);

  const toggleGroup = (status: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-omnifocus-purple" />
      </div>
    );
  }

  const totalTasks = actions.length;
  const activeTasks = actions.filter(a => !['done', 'dropped'].includes(a.rockyStatus || '')).length;

  return (
    <div className={clsx(
      'flex-1 overflow-hidden flex flex-col',
      theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-omnifocus-light-bg'
    )}>
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between px-4 py-3 border-b',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-omnifocus-purple/20'
          )}>
            <Bot className="w-5 h-5 text-omnifocus-purple" />
          </div>
          <div>
            <h1 className={clsx(
              'text-xl font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Rocky's Queue
            </h1>
            <p className={clsx(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {activeTasks} active tasks, {totalTasks} total
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {totalTasks === 0 ? (
          <div className={clsx(
            'text-center py-12',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tasks for Rocky</p>
            <p className="text-sm mt-1">
              Create tasks and assign them to Rocky to see them here
            </p>
          </div>
        ) : (
          rockyStatusOrder.map(status => {
            const statusActions = groupedActions[status];
            if (statusActions.length === 0) return null;

            const isCollapsed = collapsedGroups.has(status);

            return (
              <div key={status}>
                <button
                  onClick={() => toggleGroup(status)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors',
                    theme === 'dark'
                      ? 'hover:bg-omnifocus-surface'
                      : 'hover:bg-gray-100'
                  )}
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                  <span className={clsx(
                    'w-2 h-2 rounded-full',
                    rockyStatusColors[status]
                  )} />
                  <span className={clsx(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {rockyStatusLabels[status]}
                  </span>
                  <span className={clsx(
                    'px-1.5 py-0.5 text-xs rounded-full',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                  )}>
                    {statusActions.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <ul className="mt-1 space-y-1 pl-6">
                    {statusActions.map(action => (
                      <ActionItem key={action.id} action={action} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
