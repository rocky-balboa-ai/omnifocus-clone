'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore, Action } from '@/stores/app.store';
import {
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
  Clock,
  GripVertical,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  CornerUpLeft,
  PauseCircle,
  Square,
  CheckSquare,
  CalendarDays,
  Sun,
  CalendarClock,
  X,
  Copy,
} from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday, isFuture, addDays, startOfDay, nextMonday } from 'date-fns';

interface SortableActionItemProps {
  action: Action;
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function SortableActionItem({
  action,
  depth = 0,
  hasChildren = false,
  isCollapsed = false,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}: SortableActionItemProps) {
  const {
    completeAction,
    setSelectedAction,
    selectedActionId,
    toggleActionCollapsed,
    indentAction,
    outdentAction,
    updateAction,
    createAction,
    theme,
  } = useAppStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isHighlighted = selectedActionId === action.id;
  const isDueSoon = action.dueDate && (isToday(new Date(action.dueDate)) || isPast(new Date(action.dueDate)));
  const isDeferred = action.deferDate && isFuture(new Date(action.deferDate));

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeAction(action.id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleActionCollapsed(action.id);
  };

  const handleIndent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await indentAction(action.id);
  };

  const handleOutdent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await outdentAction(action.id);
  };

  const handleQuickDate = async (e: React.MouseEvent, date: Date | null) => {
    e.stopPropagation();
    await updateAction(action.id, { dueDate: date?.toISOString() || null } as any);
  };

  const handleToggleFlag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateAction(action.id, { flagged: !action.flagged } as any);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await createAction({
      title: `${action.title} (copy)`,
      note: action.note,
      status: 'active',
      flagged: action.flagged,
      dueDate: action.dueDate,
      deferDate: action.deferDate,
      estimatedMinutes: action.estimatedMinutes,
      projectId: action.projectId,
    });
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedAction(action.id)}
      className={clsx(
        'group flex items-start gap-1 p-2 rounded-lg cursor-pointer transition-colors',
        isHighlighted
          ? 'bg-omnifocus-purple/20 border border-omnifocus-purple'
          : theme === 'dark'
            ? 'hover:bg-omnifocus-surface border border-transparent'
            : 'hover:bg-gray-100 border border-transparent',
        isDragging && (theme === 'dark' ? 'opacity-50 shadow-lg bg-omnifocus-surface' : 'opacity-50 shadow-lg bg-gray-100'),
        isSelected && isSelectMode && 'bg-omnifocus-purple/10'
      )}
    >
      {/* Indent spacer */}
      {depth > 0 && (
        <div
          className="shrink-0"
          style={{ width: `${depth * 20}px` }}
        />
      )}

      {/* Drag handle or selection checkbox */}
      {isSelectMode ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          className="mt-0.5 p-1 text-gray-500 hover:text-omnifocus-purple transition-colors shrink-0"
        >
          {isSelected ? (
            <CheckSquare size={16} className="text-omnifocus-purple" />
          ) : (
            <Square size={16} />
          )}
        </button>
      ) : (
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      )}

      {/* Collapse/expand toggle */}
      {hasChildren ? (
        <button
          onClick={handleToggleCollapse}
          className="mt-0.5 p-0.5 text-gray-500 hover:text-white transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
      ) : (
        <div className="w-5 shrink-0" />
      )}

      <button
        onClick={handleComplete}
        className="mt-0.5 text-gray-500 hover:text-omnifocus-purple transition-colors shrink-0"
      >
        {action.status === 'completed' ? (
          <CheckCircle2 size={18} className="text-green-500" />
        ) : (
          <Circle size={18} />
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
          {action.flagged && <Flag size={14} className="text-omnifocus-orange shrink-0" />}
          {isDeferred && (
            <span className="flex items-center gap-1 text-xs text-omnifocus-orange shrink-0" title={`Available ${format(new Date(action.deferDate!), 'MMM d')}`}>
              <PauseCircle size={14} />
            </span>
          )}
          {hasChildren && isCollapsed && (
            <span className="text-xs text-gray-500 shrink-0">
              ({action.children?.length || 0})
            </span>
          )}
        </div>

        {/* Notes preview */}
        {action.note && (
          <p className={clsx(
            'text-xs mt-1 line-clamp-1',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {action.note}
          </p>
        )}

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
            <div className="hidden md:flex items-center gap-1">
              {action.tags.slice(0, 2).map(({ tag }) => (
                <span
                  key={tag.id}
                  className={clsx(
                    'px-1.5 py-0.5 rounded',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                  )}
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

      {/* Action buttons - shown on hover */}
      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        {/* Quick date buttons */}
        <button
          onClick={(e) => handleQuickDate(e, startOfDay(new Date()))}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-border text-gray-500 hover:text-omnifocus-orange'
              : 'hover:bg-orange-50 text-gray-400 hover:text-omnifocus-orange'
          )}
          title="Due today"
        >
          <Sun size={14} />
        </button>
        <button
          onClick={(e) => handleQuickDate(e, addDays(startOfDay(new Date()), 1))}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-border text-gray-500 hover:text-blue-400'
              : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'
          )}
          title="Due tomorrow"
        >
          <CalendarDays size={14} />
        </button>
        <button
          onClick={(e) => handleQuickDate(e, nextMonday(startOfDay(new Date())))}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-border text-gray-500 hover:text-purple-400'
              : 'hover:bg-purple-50 text-gray-400 hover:text-purple-500'
          )}
          title="Due next week"
        >
          <CalendarClock size={14} />
        </button>
        {action.dueDate && (
          <button
            onClick={(e) => handleQuickDate(e, null)}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-border text-gray-500 hover:text-red-400'
                : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
            )}
            title="Remove due date"
          >
            <X size={14} />
          </button>
        )}

        {/* Flag toggle */}
        <button
          onClick={handleToggleFlag}
          className={clsx(
            'p-1 rounded transition-colors',
            action.flagged
              ? 'text-omnifocus-orange'
              : theme === 'dark'
                ? 'hover:bg-omnifocus-border text-gray-500 hover:text-omnifocus-orange'
                : 'hover:bg-orange-50 text-gray-400 hover:text-omnifocus-orange'
          )}
          title={action.flagged ? 'Remove flag' : 'Add flag'}
        >
          <Flag size={14} />
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-border text-gray-500 hover:text-omnifocus-purple'
              : 'hover:bg-purple-50 text-gray-400 hover:text-omnifocus-purple'
          )}
          title="Duplicate action"
        >
          <Copy size={14} />
        </button>

        {/* Indent/outdent */}
        {depth > 0 && (
          <button
            onClick={handleOutdent}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-border text-gray-500 hover:text-white'
                : 'hover:bg-gray-200 text-gray-400 hover:text-gray-900'
            )}
            title="Outdent (move up a level)"
          >
            <CornerUpLeft size={14} />
          </button>
        )}
        <button
          onClick={handleIndent}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-border text-gray-500 hover:text-white'
              : 'hover:bg-gray-200 text-gray-400 hover:text-gray-900'
          )}
          title="Indent (make subtask)"
        >
          <CornerDownRight size={14} />
        </button>
      </div>
    </li>
  );
}
