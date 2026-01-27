'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Plus,
  MoreHorizontal,
  Flag,
  Calendar,
  GripVertical,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import clsx from 'clsx';

type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  filter: (action: any) => boolean;
};

interface KanbanBoardProps {
  projectId?: string;
  columns?: KanbanColumn[];
  className?: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'bg-gray-500',
    filter: (a) => a.status === 'active' && !a.deferDate,
  },
  {
    id: 'deferred',
    title: 'Deferred',
    color: 'bg-yellow-500',
    filter: (a) => a.status === 'active' && a.deferDate && new Date(a.deferDate) > new Date(),
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-blue-500',
    filter: (a) => a.status === 'active' && a.flagged,
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-green-500',
    filter: (a) => a.status === 'completed',
  },
];

export function KanbanBoard({
  projectId,
  columns = DEFAULT_COLUMNS,
  className,
}: KanbanBoardProps) {
  const { theme, actions, updateAction, setSelectedAction, setQuickEntryOpen } = useAppStore();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Filter actions by project if specified
  const filteredActions = useMemo(() => {
    if (projectId) {
      return actions.filter(a => a.projectId === projectId);
    }
    return actions;
  }, [actions, projectId]);

  // Group actions by column
  const columnData = useMemo(() => {
    return columns.map(col => ({
      ...col,
      actions: filteredActions.filter(col.filter),
    }));
  }, [columns, filteredActions]);

  const handleDragStart = (e: React.DragEvent, actionId: string) => {
    setDraggedItem(actionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem) return;

    // Update action based on column
    const updates: any = {};
    switch (columnId) {
      case 'todo':
        updates.status = 'active';
        updates.flagged = false;
        updates.deferDate = null;
        break;
      case 'deferred':
        updates.status = 'active';
        updates.deferDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'in-progress':
        updates.status = 'active';
        updates.flagged = true;
        break;
      case 'completed':
        updates.status = 'completed';
        updates.completedAt = new Date().toISOString();
        break;
    }

    await updateAction(draggedItem, updates);
    setDraggedItem(null);
  };

  return (
    <div className={clsx('flex gap-4 overflow-x-auto p-4 h-full', className)}>
      {columnData.map(column => (
        <div
          key={column.id}
          className={clsx(
            'flex-shrink-0 w-72 flex flex-col rounded-xl',
            theme === 'dark' ? 'bg-omnifocus-surface/50' : 'bg-gray-100'
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column header */}
          <div className={clsx(
            'flex items-center justify-between p-3 border-b',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <div className={clsx('w-2 h-2 rounded-full', column.color)} />
              <h3 className={clsx(
                'font-semibold text-sm',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {column.title}
              </h3>
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-xs',
                theme === 'dark' ? 'bg-omnifocus-bg text-gray-400' : 'bg-gray-200 text-gray-600'
              )}>
                {column.actions.length}
              </span>
            </div>
            <button
              onClick={() => setQuickEntryOpen(true)}
              className={clsx(
                'p-1 rounded transition-colors',
                theme === 'dark'
                  ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
              )}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Column content */}
          <div className={clsx(
            'flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]',
            dragOverColumn === column.id && 'bg-omnifocus-purple/10'
          )}>
            {column.actions.length === 0 ? (
              <p className={clsx(
                'text-center text-sm py-8',
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              )}>
                No tasks
              </p>
            ) : (
              column.actions.map(action => (
                <KanbanCard
                  key={action.id}
                  action={action}
                  isDragging={draggedItem === action.id}
                  onDragStart={(e) => handleDragStart(e, action.id)}
                  onClick={() => setSelectedAction(action.id)}
                  theme={theme}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Kanban card component
interface KanbanCardProps {
  action: any;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
  theme: 'light' | 'dark';
}

function KanbanCard({ action, isDragging, onDragStart, onClick, theme }: KanbanCardProps) {
  const isOverdue = action.dueDate && isPast(new Date(action.dueDate)) && action.status !== 'completed';
  const isDueToday = action.dueDate && isToday(new Date(action.dueDate));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isDragging && 'opacity-50',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
      )}
    >
      {/* Drag handle */}
      <div className="flex items-start gap-2">
        <div className={clsx(
          'mt-0.5 cursor-grab',
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        )}>
          <GripVertical size={14} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start gap-2">
            {action.status === 'completed' ? (
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle size={16} className={clsx(
                'shrink-0 mt-0.5',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )} />
            )}
            <p className={clsx(
              'text-sm font-medium',
              action.status === 'completed'
                ? 'line-through text-gray-500'
                : theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {action.title}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {action.flagged && (
              <Flag size={12} className="text-omnifocus-orange" />
            )}
            {action.dueDate && (
              <span className={clsx(
                'flex items-center gap-1 text-xs',
                isOverdue
                  ? 'text-red-500'
                  : isDueToday
                    ? 'text-omnifocus-orange'
                    : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                <Calendar size={10} />
                {format(new Date(action.dueDate), 'MMM d')}
              </span>
            )}
            {action.tags && action.tags.length > 0 && (
              <div className="flex gap-1">
                {action.tags.slice(0, 2).map((t: any) => (
                  <span
                    key={t.tag.id}
                    className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px]',
                      theme === 'dark'
                        ? 'bg-omnifocus-surface text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Project Kanban Board (specific to projects)
interface ProjectKanbanProps {
  projectId: string;
  className?: string;
}

export function ProjectKanban({ projectId, className }: ProjectKanbanProps) {
  const PROJECT_COLUMNS: KanbanColumn[] = [
    {
      id: 'backlog',
      title: 'Backlog',
      color: 'bg-gray-500',
      filter: (a) => a.status === 'active' && !a.flagged && !a.dueDate,
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      color: 'bg-purple-500',
      filter: (a) => a.status === 'active' && a.dueDate && !a.flagged,
    },
    {
      id: 'focus',
      title: 'Focus',
      color: 'bg-orange-500',
      filter: (a) => a.status === 'active' && a.flagged,
    },
    {
      id: 'done',
      title: 'Done',
      color: 'bg-green-500',
      filter: (a) => a.status === 'completed',
    },
  ];

  return <KanbanBoard projectId={projectId} columns={PROJECT_COLUMNS} className={className} />;
}

// Status-based Kanban Board
export function StatusKanban({ className }: { className?: string }) {
  const STATUS_COLUMNS: KanbanColumn[] = [
    {
      id: 'active',
      title: 'Active',
      color: 'bg-blue-500',
      filter: (a) => a.status === 'active',
    },
    {
      id: 'on-hold',
      title: 'On Hold',
      color: 'bg-yellow-500',
      filter: (a) => a.status === 'on_hold',
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-500',
      filter: (a) => a.status === 'completed',
    },
    {
      id: 'dropped',
      title: 'Dropped',
      color: 'bg-gray-500',
      filter: (a) => a.status === 'dropped',
    },
  ];

  return <KanbanBoard columns={STATUS_COLUMNS} className={className} />;
}
