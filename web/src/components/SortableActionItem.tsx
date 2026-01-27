'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore, Action } from '@/stores/app.store';
import { ActionContextMenu } from './ActionContextMenu';
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
  FolderKanban,
  Tags,
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
    projects,
    setFilterTagId,
    fetchActions,
    currentPerspective,
  } = useAppStore();

  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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
    if (action.status === 'completed') {
      // If already completed, just toggle back
      await completeAction(action.id);
      return;
    }
    // Start completion animation
    setIsCompleting(true);
    // Wait for animation
    setTimeout(async () => {
      await completeAction(action.id);
      setIsCompleting(false);
    }, 300);
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

  const handleQuickDefer = async (e: React.MouseEvent, date: Date | null) => {
    e.stopPropagation();
    await updateAction(action.id, { deferDate: date?.toISOString() || null } as any);
  };

  const handleQuickEstimate = async (e: React.MouseEvent, minutes: number | null) => {
    e.stopPropagation();
    await updateAction(action.id, { estimatedMinutes: minutes } as any);
  };

  const handleAssignProject = async (e: React.MouseEvent, projectId: string | null) => {
    e.stopPropagation();
    await updateAction(action.id, { projectId } as any);
    setShowProjectMenu(false);
  };

  const activeProjects = projects.filter(p => p.status === 'active');

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
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
    <>
    <li
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedAction(action.id)}
      onContextMenu={handleContextMenu}
      className={clsx(
        'group flex items-start gap-1 p-2 rounded-lg cursor-pointer transition-colors',
        isHighlighted
          ? 'bg-omnifocus-purple/20 border border-omnifocus-purple'
          : theme === 'dark'
            ? 'hover:bg-omnifocus-surface border border-transparent'
            : 'hover:bg-gray-100 border border-transparent',
        isDragging && (theme === 'dark' ? 'opacity-50 shadow-lg bg-omnifocus-surface' : 'opacity-50 shadow-lg bg-gray-100'),
        isSelected && isSelectMode && 'bg-omnifocus-purple/10',
        isCompleting && 'animate-complete-item'
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
        ) : isCompleting ? (
          <CheckCircle2 size={18} className="text-green-500 animate-complete-check" />
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
          {hasChildren && (
            <span className={clsx(
              'flex items-center gap-1 text-xs shrink-0',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {(() => {
                const total = action.children?.length || 0;
                const completed = action.children?.filter(c => c.status === 'completed').length || 0;
                const allDone = total > 0 && completed === total;
                return (
                  <>
                    <span className={allDone ? 'text-green-500' : ''}>
                      {completed}/{total}
                    </span>
                    {!isCollapsed && total > 0 && (
                      <div className={clsx(
                        'w-8 h-1 rounded-full overflow-hidden',
                        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
                      )}>
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            allDone ? 'bg-green-500' : 'bg-omnifocus-purple'
                          )}
                          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
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

        {/* Defer toggle */}
        {isDeferred ? (
          <button
            onClick={(e) => handleQuickDefer(e, null)}
            className={clsx(
              'p-1 rounded transition-colors text-omnifocus-orange',
              theme === 'dark'
                ? 'hover:bg-omnifocus-border hover:text-red-400'
                : 'hover:bg-red-50 hover:text-red-500'
            )}
            title="Remove defer date"
          >
            <PauseCircle size={14} />
          </button>
        ) : (
          <button
            onClick={(e) => handleQuickDefer(e, addDays(startOfDay(new Date()), 1))}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-border text-gray-500 hover:text-omnifocus-orange'
                : 'hover:bg-orange-50 text-gray-400 hover:text-omnifocus-orange'
            )}
            title="Defer until tomorrow"
          >
            <PauseCircle size={14} />
          </button>
        )}

        {/* Project assignment */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProjectMenu(!showProjectMenu);
            }}
            className={clsx(
              'p-1 rounded transition-colors',
              action.projectId
                ? 'text-blue-400'
                : theme === 'dark'
                  ? 'hover:bg-omnifocus-border text-gray-500 hover:text-blue-400'
                  : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'
            )}
            title={action.project ? `Project: ${action.project.name}` : 'Assign to project'}
          >
            <FolderKanban size={14} />
          </button>
          {showProjectMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProjectMenu(false);
                }}
              />
              <div className={clsx(
                'absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border z-20 min-w-[160px] max-h-[200px] overflow-y-auto',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                <button
                  onClick={(e) => handleAssignProject(e, null)}
                  className={clsx(
                    'w-full px-3 py-1.5 text-left text-xs transition-colors',
                    !action.projectId
                      ? 'text-omnifocus-purple font-medium'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-omnifocus-border'
                        : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  No Project (Inbox)
                </button>
                {activeProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={(e) => handleAssignProject(e, project.id)}
                    className={clsx(
                      'w-full px-3 py-1.5 text-left text-xs transition-colors truncate',
                      action.projectId === project.id
                        ? 'text-omnifocus-purple font-medium'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-border'
                          : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tag quick-view */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (action.tags.length === 0) {
                // No tags - open detail panel to add
                setSelectedAction(action.id);
              } else {
                setShowTagMenu(!showTagMenu);
              }
            }}
            className={clsx(
              'p-1 rounded transition-colors',
              action.tags.length > 0
                ? 'text-green-400'
                : theme === 'dark'
                  ? 'hover:bg-omnifocus-border text-gray-500 hover:text-green-400'
                  : 'hover:bg-green-50 text-gray-400 hover:text-green-500'
            )}
            title={action.tags.length > 0 ? `Tags: ${action.tags.map(t => t.tag.name).join(', ')}` : 'Add tags (opens detail)'}
          >
            <Tags size={14} />
          </button>
          {showTagMenu && action.tags.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTagMenu(false);
                }}
              />
              <div className={clsx(
                'absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border z-20 min-w-[140px]',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                <div className={clsx(
                  'px-3 py-1 text-xs font-medium border-b mb-1',
                  theme === 'dark' ? 'text-gray-500 border-omnifocus-border' : 'text-gray-400 border-gray-200'
                )}>
                  Click to filter by tag
                </div>
                {action.tags.map(({ tag }) => (
                  <button
                    key={tag.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterTagId(tag.id);
                      fetchActions(currentPerspective);
                      setShowTagMenu(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center gap-2',
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-omnifocus-border'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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

        {/* Quick time estimates */}
        <button
          onClick={(e) => {
            // Cycle through: 5 -> 15 -> 30 -> 60 -> null -> 5...
            const estimates = [5, 15, 30, 60, null];
            const currentIdx = estimates.indexOf(action.estimatedMinutes || null);
            const nextIdx = (currentIdx + 1) % estimates.length;
            handleQuickEstimate(e, estimates[nextIdx]);
          }}
          className={clsx(
            'p-1 rounded transition-colors',
            action.estimatedMinutes
              ? 'text-blue-400'
              : theme === 'dark'
                ? 'hover:bg-omnifocus-border text-gray-500 hover:text-blue-400'
                : 'hover:bg-blue-50 text-gray-400 hover:text-blue-500'
          )}
          title={action.estimatedMinutes ? `${action.estimatedMinutes}m (click to cycle)` : 'Add time estimate'}
        >
          <Clock size={14} />
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
