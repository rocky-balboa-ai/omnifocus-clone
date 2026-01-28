'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// Removed restrictToVerticalAxis to allow horizontal drag for indent/outdent
import { useAppStore, Action } from '@/stores/app.store';
import { SortableActionItem } from './SortableActionItem';
import { Plus, Search, Eye, EyeOff, Trash2, Clock, X, Tag, CheckSquare, Square, Flag, FlagOff, Inbox, CheckCircle2, Sparkles, CornerDownLeft, Maximize2, Minimize2, AlertTriangle, Calendar, Filter, Sun, CalendarDays, CalendarClock, ArrowUpDown, FolderKanban, Timer } from 'lucide-react';
import { isBefore, isToday, startOfDay, isFuture, addDays, nextMonday } from 'date-fns';
import { parseQuickAdd } from '@/lib/parseQuickAdd';

type QuickFilter = 'all' | 'overdue' | 'today' | 'flagged' | 'upcoming';
type SortOption = 'manual' | 'due-date' | 'name' | 'flagged' | 'created';
type TimeFilter = 'all' | '5' | '15' | '30' | '60';
import clsx from 'clsx';
import { ExportMenu } from './ExportMenu';

interface ActionWithDepth {
  action: Action;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
}

export function ActionList() {
  const {
    actions,
    isLoading,
    currentPerspective,
    perspectives,
    setQuickEntryOpen,
    setSearchOpen,
    showCompleted,
    setShowCompleted,
    reorderActions,
    collapsedActionIds,
    cleanupCompleted,
    filterTagId,
    setFilterTagId,
    fetchActions,
    tags,
    selectedActionIds,
    toggleActionSelection,
    clearActionSelection,
    selectAllActions,
    bulkCompleteActions,
    bulkDeleteActions,
    bulkFlagActions,
    bulkSetDueDate,
    bulkSetProject,
    theme,
    createAction,
    projects,
    isFocusMode,
    toggleFocusMode,
    setFocusTimerOpen,
    updateAction,
    indentAction,
    outdentAction,
  } = useAppStore();

  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showDeferred, setShowDeferred] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('manual');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBulkProjectMenu, setShowBulkProjectMenu] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);

  const selectionCount = selectedActionIds.size;

  const perspective = perspectives.find((p) => p.id === currentPerspective);
  const filterTag = filterTagId ? tags.find((t) => t.id === filterTagId) : null;

  const clearTagFilter = () => {
    setFilterTagId(null);
    fetchActions(currentPerspective);
  };

  const now = new Date();
  const today = startOfDay(new Date());

  // Helper to check if action is deferred (defer date is in the future)
  const isDeferred = (action: Action): boolean => {
    if (!action.deferDate) return false;
    return new Date(action.deferDate) > now;
  };

  // Filter out completed actions unless showCompleted is true
  // Filter out deferred actions unless showDeferred is true
  // Apply quick filter
  const filteredActions = actions.filter((a) => {
    // Filter completed
    if (a.status === 'completed' && !showCompleted) return false;
    // Filter deferred (only for active actions)
    if (a.status === 'active' && isDeferred(a) && !showDeferred) return false;

    // Apply quick filter
    if (quickFilter !== 'all' && a.status === 'active') {
      switch (quickFilter) {
        case 'overdue':
          if (!a.dueDate || !isBefore(new Date(a.dueDate), today)) return false;
          break;
        case 'today':
          if (!a.dueDate || !isToday(new Date(a.dueDate))) return false;
          break;
        case 'flagged':
          if (!a.flagged) return false;
          break;
        case 'upcoming':
          if (!a.dueDate || isBefore(new Date(a.dueDate), today)) return false;
          break;
      }
    }

    // Apply time filter
    if (timeFilter !== 'all' && a.status === 'active') {
      const maxMinutes = parseInt(timeFilter);
      if (!a.estimatedMinutes || a.estimatedMinutes > maxMinutes) return false;
    }

    return true;
  });

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const activeActions = actions.filter(a => a.status === 'active' && (!isDeferred(a) || showDeferred));
    return {
      overdue: activeActions.filter(a => a.dueDate && isBefore(new Date(a.dueDate), today)).length,
      today: activeActions.filter(a => a.dueDate && isToday(new Date(a.dueDate))).length,
      flagged: activeActions.filter(a => a.flagged).length,
      upcoming: activeActions.filter(a => a.dueDate && !isBefore(new Date(a.dueDate), today)).length,
    };
  }, [actions, showDeferred, today]);

  const completedCount = actions.filter((a) => a.status === 'completed').length;
  const deferredCount = actions.filter((a) => a.status === 'active' && isDeferred(a)).length;

  // Sort function for actions
  const sortActions = (actions: Action[]): Action[] => {
    if (sortBy === 'manual') return actions;

    return [...actions].sort((a, b) => {
      switch (sortBy) {
        case 'due-date':
          // Actions with no due date go to the end
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'flagged':
          // Flagged first
          if (a.flagged && !b.flagged) return -1;
          if (!a.flagged && b.flagged) return 1;
          return 0;
        case 'created':
          // Use position as proxy for creation order (newer = higher position)
          return b.position - a.position;
        default:
          return 0;
      }
    });
  };

  // Build flattened tree with depth info
  const flattenedActions = useMemo(() => {
    const result: ActionWithDepth[] = [];
    const childrenMap = new Map<string | null, Action[]>();

    // Group actions by parent
    filteredActions.forEach(action => {
      const parentId = action.parentId || null;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(action);
    });

    // Sort each group
    childrenMap.forEach((children, parentId) => {
      childrenMap.set(parentId, sortActions(children));
    });

    // Recursive function to flatten tree
    const flatten = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId) || [];
      children.forEach(action => {
        const actionChildren = childrenMap.get(action.id) || [];
        const hasChildren = actionChildren.length > 0;
        const isCollapsed = collapsedActionIds.has(action.id);

        result.push({ action, depth, hasChildren, isCollapsed });

        // Only recurse if not collapsed
        if (!isCollapsed && hasChildren) {
          flatten(action.id, depth + 1);
        }
      });
    };

    flatten(null, 0);
    return result;
  }, [filteredActions, collapsedActionIds, sortBy]);

  // Calculate total estimated time for visible actions
  const totalEstimatedMinutes = useMemo(() => {
    return flattenedActions.reduce((total, { action }) => {
      if (action.status === 'active' && action.estimatedMinutes) {
        return total + action.estimatedMinutes;
      }
      return total;
    }, 0);
  }, [flattenedActions]);

  // Format minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    // Track initial X position for horizontal movement detection
    const rect = event.active.rect.current?.initial;
    if (rect) {
      setDragStartX(rect.left);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveDragId(null);

    if (!over) return;

    const draggedId = active.id as string;
    const targetId = over.id as string;

    // Check for horizontal movement (indent/outdent)
    const horizontalThreshold = 40; // pixels

    if (delta && Math.abs(delta.x) > horizontalThreshold) {
      // Horizontal drag detected
      if (delta.x > horizontalThreshold) {
        // Dragged right - indent (make child of item above)
        indentAction(draggedId);
        return;
      } else if (delta.x < -horizontalThreshold) {
        // Dragged left - outdent (move up a level)
        outdentAction(draggedId);
        return;
      }
    }

    // Check if dropped directly on another task (to make it a subtask)
    // This happens when active and over are the same (dropped in place but with intent)
    // For now, use vertical reorder logic
    if (draggedId !== targetId) {
      const oldIndex = flattenedActions.findIndex((a) => a.action.id === draggedId);
      const newIndex = flattenedActions.findIndex((a) => a.action.id === targetId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...flattenedActions];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);

        reorderActions(newOrder.map((a) => a.action.id));
      }
    }
  }, [flattenedActions, reorderActions, indentAction, outdentAction]);

  const handleAddAction = () => {
    setQuickEntryOpen(true);
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;

    setIsQuickAdding(true);
    try {
      // Parse smart input for dates, flags, estimates
      const parsed = parseQuickAdd(quickAddText);

      // Find project by name if specified
      let projectId: string | undefined;
      if (parsed.projectName) {
        const matchingProject = projects.find(
          p => p.name.toLowerCase() === parsed.projectName!.toLowerCase() ||
               p.name.toLowerCase().startsWith(parsed.projectName!.toLowerCase())
        );
        if (matchingProject) {
          projectId = matchingProject.id;
        }
      }

      await createAction({
        title: parsed.title,
        dueDate: parsed.dueDate,
        deferDate: parsed.deferDate,
        flagged: parsed.flagged,
        estimatedMinutes: parsed.estimatedMinutes,
        projectId,
      });
      setQuickAddText('');
    } catch (error) {
      console.error('Failed to create action:', error);
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Delete completed actions older than 7 days? This cannot be undone.')) return;

    setIsCleaningUp(true);
    try {
      const result = await cleanupCompleted(7);
      if (result.deleted > 0) {
        alert(`Cleaned up ${result.deleted} completed action${result.deleted === 1 ? '' : 's'}.`);
      } else {
        alert('No old completed actions to clean up.');
      }
    } catch (error) {
      console.error('Failed to cleanup:', error);
      alert('Failed to clean up completed actions.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className={clsx(
        'px-4 md:px-6 py-3 md:py-4 border-b safe-area-top flex items-center justify-between gap-3',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-omnifocus-light-border'
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold truncate',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {filterTag ? `Tag: ${filterTag.name}` : (perspective?.name || 'Inbox')}
          </h2>
          {filterTag && (
            <button
              onClick={clearTagFilter}
              className="p-1 rounded-full bg-omnifocus-purple/20 text-omnifocus-purple hover:bg-omnifocus-purple/30 transition-colors shrink-0"
              title="Clear tag filter"
            >
              <X size={14} />
            </button>
          )}
          {/* Estimated time badge */}
          {totalEstimatedMinutes > 0 && (
            <span className={clsx(
              'hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs shrink-0',
              theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400'
                : 'bg-gray-100 text-gray-500'
            )}>
              <Clock size={12} />
              {formatDuration(totalEstimatedMinutes)}
            </span>
          )}
        </div>

        {/* Show/Hide Deferred toggle */}
        {deferredCount > 0 && (
          <button
            onClick={() => setShowDeferred(!showDeferred)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              showDeferred
                ? 'bg-omnifocus-orange/20 text-omnifocus-orange'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'bg-omnifocus-light-surface text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
            title={showDeferred ? 'Hide deferred' : 'Show deferred'}
          >
            <Clock size={16} />
            <span className="hidden md:inline">{deferredCount}</span>
          </button>
        )}

        {/* Show/Hide Completed toggle */}
        {completedCount > 0 && (
          <>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
                showCompleted
                  ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                    : 'bg-omnifocus-light-surface text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              )}
              title={showCompleted ? 'Hide completed' : 'Show completed'}
            >
              {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="hidden md:inline">{completedCount}</span>
            </button>

            {/* Clean Up button - only show when completed are visible */}
            {showCompleted && (
              <button
                onClick={handleCleanup}
                disabled={isCleaningUp}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm disabled:opacity-50',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-400 hover:text-red-400 hover:bg-omnifocus-border'
                    : 'bg-omnifocus-light-surface text-gray-500 hover:text-red-500 hover:bg-gray-200'
                )}
                title="Clean up old completed actions"
              >
                <Trash2 size={16} />
                <span className="hidden md:inline">{isCleaningUp ? 'Cleaning...' : 'Clean Up'}</span>
              </button>
            )}
          </>
        )}

        {/* Select mode toggle */}
        <button
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            if (isSelectMode) clearActionSelection();
          }}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            isSelectMode
              ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
              : theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                : 'bg-omnifocus-light-surface text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title={isSelectMode ? 'Exit select mode' : 'Select multiple'}
        >
          <CheckSquare size={16} />
        </button>

        {/* Time filter */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowTimeFilter(!showTimeFilter)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              timeFilter !== 'all'
                ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
            title="Filter by time estimate"
          >
            <Timer size={16} />
            {timeFilter !== 'all' && <span>≤{timeFilter}m</span>}
          </button>
          {showTimeFilter && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowTimeFilter(false)}
              />
              <div className={clsx(
                'absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border z-20 min-w-[140px]',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                {[
                  { value: 'all' as const, label: 'All Tasks' },
                  { value: '5' as const, label: '≤ 5 minutes' },
                  { value: '15' as const, label: '≤ 15 minutes' },
                  { value: '30' as const, label: '≤ 30 minutes' },
                  { value: '60' as const, label: '≤ 1 hour' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeFilter(option.value);
                      setShowTimeFilter(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      timeFilter === option.value
                        ? 'text-omnifocus-purple bg-omnifocus-purple/10'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-border'
                          : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort menu */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              sortBy !== 'manual'
                ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
            title="Sort actions"
          >
            <ArrowUpDown size={16} />
          </button>
          {showSortMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortMenu(false)}
              />
              <div className={clsx(
                'absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border z-20 min-w-[140px]',
                theme === 'dark'
                  ? 'bg-omnifocus-surface border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                {[
                  { value: 'manual', label: 'Manual' },
                  { value: 'due-date', label: 'Due Date' },
                  { value: 'name', label: 'Name' },
                  { value: 'flagged', label: 'Flagged' },
                  { value: 'created', label: 'Newest First' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as SortOption);
                      setShowSortMenu(false);
                    }}
                    className={clsx(
                      'w-full px-3 py-1.5 text-left text-sm transition-colors',
                      sortBy === option.value
                        ? 'text-omnifocus-purple font-medium'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-border'
                          : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Focus Timer button */}
        <button
          onClick={() => setFocusTimerOpen(true)}
          className={clsx(
            'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-omnifocus-purple hover:bg-omnifocus-border'
              : 'bg-omnifocus-light-surface text-gray-500 hover:text-omnifocus-purple hover:bg-gray-200'
          )}
          title="Focus Timer"
        >
          <Timer size={16} />
        </button>

        {/* Focus mode toggle */}
        <button
          onClick={toggleFocusMode}
          className={clsx(
            'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            isFocusMode
              ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
              : theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                : 'bg-omnifocus-light-surface text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
          title={isFocusMode ? 'Exit focus mode (⌘\\)' : 'Focus mode (⌘\\)'}
        >
          {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
              : 'bg-omnifocus-light-surface text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
        >
          <Search size={16} />
          <span className="hidden md:inline">Search</span>
          <kbd className={clsx(
            'hidden md:inline px-1.5 py-0.5 text-xs rounded',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white border border-gray-200'
          )}>⌘K</kbd>
        </button>

        {/* Export menu */}
        <ExportMenu />

        {/* Desktop only: Add Action button */}
        <button
          onClick={handleAddAction}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Action</span>
        </button>
      </header>

      {/* Quick Filter Bar */}
      {(filterCounts.overdue > 0 || filterCounts.today > 0 || filterCounts.flagged > 0) && (
        <div className={clsx(
          'px-4 md:px-6 py-2 border-b flex items-center gap-2 overflow-x-auto',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <Filter size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          <button
            onClick={() => setQuickFilter('all')}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              quickFilter === 'all'
                ? 'bg-omnifocus-purple text-white'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
            )}
          >
            All
          </button>
          {filterCounts.overdue > 0 && (
            <button
              onClick={() => setQuickFilter(quickFilter === 'overdue' ? 'all' : 'overdue')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1',
                quickFilter === 'overdue'
                  ? 'bg-red-500 text-white'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-red-400 hover:bg-red-500/20'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
              )}
            >
              <AlertTriangle size={12} />
              Overdue ({filterCounts.overdue})
            </button>
          )}
          {filterCounts.today > 0 && (
            <button
              onClick={() => setQuickFilter(quickFilter === 'today' ? 'all' : 'today')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1',
                quickFilter === 'today'
                  ? 'bg-omnifocus-orange text-white'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-omnifocus-orange hover:bg-omnifocus-orange/20'
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              )}
            >
              <Calendar size={12} />
              Today ({filterCounts.today})
            </button>
          )}
          {filterCounts.flagged > 0 && (
            <button
              onClick={() => setQuickFilter(quickFilter === 'flagged' ? 'all' : 'flagged')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1',
                quickFilter === 'flagged'
                  ? 'bg-omnifocus-orange text-white'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-omnifocus-orange hover:bg-omnifocus-orange/20'
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              )}
            >
              <Flag size={12} />
              Flagged ({filterCounts.flagged})
            </button>
          )}
          {filterCounts.upcoming > 0 && (
            <button
              onClick={() => setQuickFilter(quickFilter === 'upcoming' ? 'all' : 'upcoming')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1',
                quickFilter === 'upcoming'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-blue-400 hover:bg-blue-500/20'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              )}
            >
              <Calendar size={12} />
              Upcoming ({filterCounts.upcoming})
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {isSelectMode && selectionCount > 0 && (
        <div className={clsx(
          'px-4 md:px-6 py-2 border-b flex items-center justify-between gap-3',
          theme === 'dark'
            ? 'bg-omnifocus-purple/10 border-omnifocus-border'
            : 'bg-purple-50 border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectionCount === flattenedActions.length) {
                  clearActionSelection();
                } else {
                  selectAllActions();
                }
              }}
              className={clsx(
                'flex items-center gap-2 text-sm',
                theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {selectionCount === flattenedActions.length ? (
                <CheckSquare size={16} className="text-omnifocus-purple" />
              ) : (
                <Square size={16} />
              )}
              <span>{selectionCount} selected</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkCompleteActions()}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-green-500 hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-green-600 hover:bg-gray-100'
              )}
              title="Complete selected"
            >
              <CheckSquare size={18} />
            </button>
            <button
              onClick={() => bulkFlagActions(true)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-omnifocus-orange hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-omnifocus-orange hover:bg-gray-100'
              )}
              title="Flag selected"
            >
              <Flag size={18} />
            </button>
            <button
              onClick={() => bulkFlagActions(false)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              )}
              title="Unflag selected"
            >
              <FlagOff size={18} />
            </button>

            {/* Separator */}
            <div className={clsx(
              'w-px h-6',
              theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
            )} />

            {/* Due date buttons */}
            <button
              onClick={() => bulkSetDueDate(startOfDay(new Date()).toISOString())}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-omnifocus-orange hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-omnifocus-orange hover:bg-gray-100'
              )}
              title="Due today"
            >
              <Sun size={18} />
            </button>
            <button
              onClick={() => bulkSetDueDate(addDays(startOfDay(new Date()), 1).toISOString())}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-blue-400 hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-blue-500 hover:bg-gray-100'
              )}
              title="Due tomorrow"
            >
              <CalendarDays size={18} />
            </button>
            <button
              onClick={() => bulkSetDueDate(nextMonday(startOfDay(new Date())).toISOString())}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-purple-400 hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-purple-500 hover:bg-gray-100'
              )}
              title="Due next week"
            >
              <CalendarClock size={18} />
            </button>
            <button
              onClick={() => bulkSetDueDate(null)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-gray-300 hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Clear due date"
            >
              <X size={18} />
            </button>

            {/* Separator */}
            <div className={clsx(
              'w-px h-6',
              theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
            )} />

            {/* Project assignment dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkProjectMenu(!showBulkProjectMenu)}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-400 hover:text-blue-400 hover:bg-omnifocus-border'
                    : 'bg-white text-gray-400 hover:text-blue-500 hover:bg-gray-100'
                )}
                title="Assign to project"
              >
                <FolderKanban size={18} />
              </button>
              {showBulkProjectMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowBulkProjectMenu(false)}
                  />
                  <div className={clsx(
                    'absolute right-0 bottom-full mb-1 py-1 rounded-lg shadow-lg border z-20 min-w-[160px] max-h-[200px] overflow-y-auto',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface border-omnifocus-border'
                      : 'bg-white border-gray-200'
                  )}>
                    <button
                      onClick={() => {
                        bulkSetProject(null);
                        setShowBulkProjectMenu(false);
                      }}
                      className={clsx(
                        'w-full px-3 py-1.5 text-left text-xs transition-colors',
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-border'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      No Project (Inbox)
                    </button>
                    {projects.filter(p => p.status === 'active').map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          bulkSetProject(project.id);
                          setShowBulkProjectMenu(false);
                        }}
                        className={clsx(
                          'w-full px-3 py-1.5 text-left text-xs transition-colors truncate',
                          theme === 'dark'
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

            {/* Separator */}
            <div className={clsx(
              'w-px h-6',
              theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
            )} />

            <button
              onClick={() => {
                if (confirm(`Delete ${selectionCount} selected action${selectionCount > 1 ? 's' : ''}?`)) {
                  bulkDeleteActions();
                }
              }}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-red-500 hover:bg-omnifocus-border'
                  : 'bg-white text-gray-400 hover:text-red-600 hover:bg-gray-100'
              )}
              title="Delete selected"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {/* Inline Quick Add */}
        <div className={clsx(
          'mb-4 rounded-lg border transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border focus-within:border-omnifocus-purple'
            : 'bg-white border-gray-200 focus-within:border-omnifocus-purple'
        )}>
          <div className="flex items-center">
            <input
              type="text"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickAdd();
                }
              }}
              placeholder="Quick add... try 'task tomorrow' or '~15m !flag'"
              disabled={isQuickAdding}
              className={clsx(
                'flex-1 px-4 py-3 bg-transparent outline-none text-sm placeholder-gray-500',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}
            />
            {quickAddText && (
              <button
                onClick={handleQuickAdd}
                disabled={isQuickAdding}
                className="px-3 py-2 mr-1 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
              >
                {isQuickAdding ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CornerDownLeft size={14} />
                    <span className="hidden md:inline">Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {flattenedActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            {actions.length > 0 && !showCompleted ? (
              // All actions completed state
              <>
                <div className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                  theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
                )}>
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className={clsx(
                  'text-lg font-semibold mb-1',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  All caught up!
                </h3>
                <p className={clsx(
                  'text-sm mb-6 text-center max-w-xs',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  You&apos;ve completed all actions in this view. Great work!
                </p>
                <button
                  onClick={() => setShowCompleted(true)}
                  className={clsx(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Eye size={18} />
                  <span>Show {completedCount} completed</span>
                </button>
              </>
            ) : (
              // No actions state
              <>
                <div className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                  theme === 'dark' ? 'bg-omnifocus-purple/10' : 'bg-purple-50'
                )}>
                  <Inbox size={32} className="text-omnifocus-purple" />
                </div>
                <h3 className={clsx(
                  'text-lg font-semibold mb-1',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {filterTag ? `No actions with "${filterTag.name}"` : 'No actions yet'}
                </h3>
                <p className={clsx(
                  'text-sm mb-6 text-center max-w-xs',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {filterTag
                    ? 'Try a different tag or add actions with this tag'
                    : 'Capture your tasks, ideas, and next actions to get started'}
                </p>
                <button
                  onClick={handleAddAction}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors font-medium"
                >
                  <Sparkles size={18} />
                  <span>Add Your First Action</span>
                </button>

                {/* Pro tips */}
                <div className={clsx(
                  'mt-8 p-4 rounded-lg text-left max-w-sm',
                  theme === 'dark' ? 'bg-omnifocus-surface/50' : 'bg-gray-50'
                )}>
                  <h4 className={clsx(
                    'text-xs font-semibold uppercase tracking-wider mb-3',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    Pro Tips
                  </h4>
                  <ul className={clsx(
                    'space-y-2 text-xs',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    <li className="flex items-center gap-2">
                      <kbd className={clsx(
                        'px-1.5 py-0.5 rounded font-mono text-[10px]',
                        theme === 'dark' ? 'bg-omnifocus-bg text-gray-500' : 'bg-white text-gray-400 border border-gray-200'
                      )}>n</kbd>
                      <span>Quick add new action</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className={clsx(
                        'px-1.5 py-0.5 rounded font-mono text-[10px]',
                        theme === 'dark' ? 'bg-omnifocus-bg text-gray-500' : 'bg-white text-gray-400 border border-gray-200'
                      )}>?</kbd>
                      <span>Show all keyboard shortcuts</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0">Try:</span>
                      <span className="text-omnifocus-purple">&quot;task tomorrow !flag ~15m&quot;</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flattenedActions.map((a) => a.action.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1">
                {flattenedActions.map(({ action, depth, hasChildren, isCollapsed }) => (
                  <SortableActionItem
                    key={action.id}
                    action={action}
                    depth={depth}
                    hasChildren={hasChildren}
                    isCollapsed={isCollapsed}
                    isSelectMode={isSelectMode}
                    isSelected={selectedActionIds.has(action.id)}
                    onToggleSelect={() => toggleActionSelection(action.id)}
                  />
                ))}
              </ul>
            </SortableContext>

            {/* Drag overlay shows hint about horizontal drag */}
            <DragOverlay>
              {activeDragId ? (
                <div className={clsx(
                  'px-3 py-2 rounded-lg shadow-lg border text-sm',
                  theme === 'dark'
                    ? 'bg-omnifocus-sidebar border-omnifocus-purple text-white'
                    : 'bg-white border-omnifocus-purple text-gray-900'
                )}>
                  <span className="opacity-75">Drag right to indent, left to outdent</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
