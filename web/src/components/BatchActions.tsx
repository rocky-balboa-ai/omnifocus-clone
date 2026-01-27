'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckSquare,
  Square,
  Trash2,
  Flag,
  FolderKanban,
  Calendar,
  Tags,
  MoreHorizontal,
  X,
  Archive,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import clsx from 'clsx';

interface BatchActionsProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectAll?: () => void;
  totalCount: number;
  className?: string;
}

export function BatchActions({
  selectedIds,
  onSelectionChange,
  onSelectAll,
  totalCount,
  className,
}: BatchActionsProps) {
  const { theme, updateAction, deleteAction, projects, tags } = useAppStore();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const hasSelection = selectedIds.length > 0;
  const allSelected = selectedIds.length === totalCount && totalCount > 0;

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const handleBatchComplete = useCallback(async () => {
    for (const id of selectedIds) {
      await updateAction(id, { status: 'completed', completedAt: new Date().toISOString() });
    }
    onSelectionChange([]);
  }, [selectedIds, updateAction, onSelectionChange]);

  const handleBatchDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await deleteAction(id);
    }
    onSelectionChange([]);
  }, [selectedIds, deleteAction, onSelectionChange]);

  const handleBatchFlag = useCallback(async (flagged: boolean) => {
    for (const id of selectedIds) {
      await updateAction(id, { flagged });
    }
  }, [selectedIds, updateAction]);

  const handleBatchSetProject = useCallback(async (projectId: string | undefined) => {
    for (const id of selectedIds) {
      await updateAction(id, { projectId });
    }
    setShowProjectMenu(false);
  }, [selectedIds, updateAction]);

  const handleBatchSetStatus = useCallback(async (status: 'active' | 'on_hold' | 'dropped') => {
    for (const id of selectedIds) {
      await updateAction(id, { status });
    }
    setShowMoreMenu(false);
  }, [selectedIds, updateAction]);

  if (!hasSelection) {
    return null;
  }

  return (
    <div className={clsx(
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
      'animate-in fade-in slide-in-from-bottom-4 duration-200',
      className
    )}>
      <div className={clsx(
        'flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar/95 border-omnifocus-border'
          : 'bg-white/95 border-gray-200'
      )}>
        {/* Selection indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-omnifocus-border">
          <button
            onClick={allSelected ? handleClearSelection : onSelectAll}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100'
            )}
          >
            {allSelected ? (
              <CheckSquare size={18} className="text-omnifocus-purple" />
            ) : (
              <Square size={18} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
            )}
          </button>
          <span className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {selectedIds.length} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Complete */}
          <button
            onClick={handleBatchComplete}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-surface text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            )}
            title="Mark as complete"
          >
            <CheckSquare size={16} className="text-green-500" />
            <span className="hidden sm:inline">Complete</span>
          </button>

          {/* Flag */}
          <button
            onClick={() => handleBatchFlag(true)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-surface text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            )}
            title="Flag selected"
          >
            <Flag size={16} className="text-omnifocus-orange" />
            <span className="hidden sm:inline">Flag</span>
          </button>

          {/* Project picker */}
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
              title="Move to project"
            >
              <FolderKanban size={16} className="text-purple-500" />
              <span className="hidden sm:inline">Project</span>
            </button>

            {showProjectMenu && (
              <div className={clsx(
                'absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-xl border overflow-hidden',
                theme === 'dark'
                  ? 'bg-omnifocus-sidebar border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                <div className="p-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleBatchSetProject(undefined)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      theme === 'dark'
                        ? 'hover:bg-omnifocus-surface text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    Inbox
                  </button>
                  {projects.filter(p => p.status === 'active').map(project => (
                    <button
                      key={project.id}
                      onClick={() => handleBatchSetProject(project.id)}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                        theme === 'dark'
                          ? 'hover:bg-omnifocus-surface text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More actions */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
              title="More actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMoreMenu && (
              <div className={clsx(
                'absolute bottom-full right-0 mb-2 w-48 rounded-xl shadow-xl border overflow-hidden',
                theme === 'dark'
                  ? 'bg-omnifocus-sidebar border-omnifocus-border'
                  : 'bg-white border-gray-200'
              )}>
                <div className="p-2">
                  <button
                    onClick={() => handleBatchFlag(false)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      theme === 'dark'
                        ? 'hover:bg-omnifocus-surface text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <Flag size={16} />
                    Remove flag
                  </button>
                  <button
                    onClick={() => handleBatchSetStatus('on_hold')}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      theme === 'dark'
                        ? 'hover:bg-omnifocus-surface text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <PauseCircle size={16} />
                    Put on hold
                  </button>
                  <button
                    onClick={() => handleBatchSetStatus('active')}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      theme === 'dark'
                        ? 'hover:bg-omnifocus-surface text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <PlayCircle size={16} />
                    Make active
                  </button>
                  <div className={clsx(
                    'my-1 border-t',
                    theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
                  )} />
                  <button
                    onClick={handleBatchDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Delete selected
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleClearSelection}
          className={clsx(
            'ml-2 p-1.5 rounded-lg transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-surface text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
          )}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// Selection checkbox for individual items
interface SelectionCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function SelectionCheckbox({ checked, onChange, className }: SelectionCheckboxProps) {
  const { theme } = useAppStore();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={clsx(
        'p-0.5 rounded transition-colors',
        theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100',
        className
      )}
    >
      {checked ? (
        <CheckSquare size={18} className="text-omnifocus-purple" />
      ) : (
        <Square size={18} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
      )}
    </button>
  );
}

// Hook for managing selection state
export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  };
}
