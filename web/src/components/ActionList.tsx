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
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useAppStore, Action } from '@/stores/app.store';
import { SortableActionItem } from './SortableActionItem';
import { Plus, Search, Eye, EyeOff, Trash2, Clock, X, Tag, CheckSquare, Square, Flag, FlagOff } from 'lucide-react';
import clsx from 'clsx';

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
  } = useAppStore();

  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showDeferred, setShowDeferred] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const selectionCount = selectedActionIds.size;

  const perspective = perspectives.find((p) => p.id === currentPerspective);
  const filterTag = filterTagId ? tags.find((t) => t.id === filterTagId) : null;

  const clearTagFilter = () => {
    setFilterTagId(null);
    fetchActions(currentPerspective);
  };

  const now = new Date();

  // Helper to check if action is deferred (defer date is in the future)
  const isDeferred = (action: Action): boolean => {
    if (!action.deferDate) return false;
    return new Date(action.deferDate) > now;
  };

  // Filter out completed actions unless showCompleted is true
  // Filter out deferred actions unless showDeferred is true
  const filteredActions = actions.filter((a) => {
    // Filter completed
    if (a.status === 'completed' && !showCompleted) return false;
    // Filter deferred (only for active actions)
    if (a.status === 'active' && isDeferred(a) && !showDeferred) return false;
    return true;
  });

  const completedCount = actions.filter((a) => a.status === 'completed').length;
  const deferredCount = actions.filter((a) => a.status === 'active' && isDeferred(a)).length;

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
  }, [filteredActions, collapsedActionIds]);

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = flattenedActions.findIndex((a) => a.action.id === active.id);
      const newIndex = flattenedActions.findIndex((a) => a.action.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...flattenedActions];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);

        reorderActions(newOrder.map((a) => a.action.id));
      }
    }
  }, [flattenedActions, reorderActions]);

  const handleAddAction = () => {
    setQuickEntryOpen(true);
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
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-omnifocus-border safe-area-top flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold text-white truncate">
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
        </div>

        {/* Show/Hide Deferred toggle */}
        {deferredCount > 0 && (
          <button
            onClick={() => setShowDeferred(!showDeferred)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              showDeferred
                ? 'bg-omnifocus-orange/20 text-omnifocus-orange'
                : 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
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
                  : 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-red-400 hover:bg-omnifocus-border transition-colors text-sm disabled:opacity-50"
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
              : 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
          )}
          title={isSelectMode ? 'Exit select mode' : 'Select multiple'}
        >
          <CheckSquare size={16} />
        </button>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border transition-colors text-sm"
        >
          <Search size={16} />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-omnifocus-bg rounded">⌘K</kbd>
        </button>

        {/* Desktop only: Add Action button */}
        <button
          onClick={handleAddAction}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Action</span>
        </button>
      </header>

      {/* Bulk action bar */}
      {isSelectMode && selectionCount > 0 && (
        <div className="px-4 md:px-6 py-2 bg-omnifocus-purple/10 border-b border-omnifocus-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectionCount === flattenedActions.length) {
                  clearActionSelection();
                } else {
                  selectAllActions();
                }
              }}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
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
              className="p-2 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-green-500 hover:bg-omnifocus-border transition-colors"
              title="Complete selected"
            >
              <CheckSquare size={18} />
            </button>
            <button
              onClick={() => bulkFlagActions(true)}
              className="p-2 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-omnifocus-orange hover:bg-omnifocus-border transition-colors"
              title="Flag selected"
            >
              <Flag size={18} />
            </button>
            <button
              onClick={() => bulkFlagActions(false)}
              className="p-2 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border transition-colors"
              title="Unflag selected"
            >
              <FlagOff size={18} />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${selectionCount} selected action${selectionCount > 1 ? 's' : ''}?`)) {
                  bulkDeleteActions();
                }
              }}
              className="p-2 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-red-500 hover:bg-omnifocus-border transition-colors"
              title="Delete selected"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {flattenedActions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {actions.length > 0 && !showCompleted
                ? 'All actions completed!'
                : 'No actions in this view'}
            </p>
            {actions.length > 0 && !showCompleted ? (
              <button
                onClick={() => setShowCompleted(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border transition-colors"
              >
                <Eye size={18} />
                <span>Show {completedCount} completed</span>
              </button>
            ) : (
              <button
                onClick={handleAddAction}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors"
              >
                <Plus size={18} />
                <span>Add Action</span>
              </button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
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
          </DndContext>
        )}
      </div>
    </div>
  );
}
