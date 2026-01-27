'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckCircle2,
  Flag,
  Calendar,
  Trash2,
  X,
  Tag,
  FolderOpen,
  Clock,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { addDays, startOfDay, endOfWeek, nextMonday } from 'date-fns';
import clsx from 'clsx';

export function BatchActionsBar() {
  const {
    theme,
    selectedActionIds,
    clearActionSelection,
    bulkCompleteActions,
    bulkDeleteActions,
    bulkFlagActions,
    bulkSetDueDate,
    bulkSetProject,
    projects,
    tags,
    actions,
  } = useAppStore();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const selectedCount = selectedActionIds.size;

  if (selectedCount === 0) return null;

  const handleComplete = async () => {
    await bulkCompleteActions();
  };

  const handleFlag = async () => {
    // Toggle: if all selected are flagged, unflag; otherwise flag all
    const selectedActions = actions.filter(a => selectedActionIds.has(a.id));
    const allFlagged = selectedActions.every(a => a.flagged);
    await bulkFlagActions(!allFlagged);
  };

  const handleDelete = async () => {
    if (confirm(`Delete ${selectedCount} action${selectedCount > 1 ? 's' : ''}?`)) {
      await bulkDeleteActions();
    }
  };

  const handleSetDueDate = async (date: Date | null) => {
    await bulkSetDueDate(date ? date.toISOString() : null);
    setShowDatePicker(false);
  };

  const handleSetProject = async (projectId: string | null) => {
    await bulkSetProject(projectId);
    setShowProjectPicker(false);
  };

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
  const nextWeek = nextMonday(today);

  const dateOptions = [
    { label: 'Today', date: today, icon: Sun },
    { label: 'Tomorrow', date: tomorrow, icon: Calendar },
    { label: 'End of Week', date: endOfThisWeek, icon: Calendar },
    { label: 'Next Week', date: nextWeek, icon: Calendar },
    { label: 'No Due Date', date: null, icon: X },
  ];

  return (
    <div className={clsx(
      'fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border',
      'animate-in slide-in-from-bottom-4 duration-200',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      {/* Selection count */}
      <div className={clsx(
        'flex items-center gap-2 pr-3 border-r',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <span className={clsx(
          'px-2 py-1 rounded-lg text-sm font-medium',
          theme === 'dark'
            ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
            : 'bg-purple-100 text-purple-700'
        )}>
          {selectedCount}
        </span>
        <span className={clsx(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          selected
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Complete */}
        <button
          onClick={handleComplete}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            theme === 'dark'
              ? 'hover:bg-green-500/20 text-gray-300 hover:text-green-400'
              : 'hover:bg-green-50 text-gray-600 hover:text-green-600'
          )}
          title="Complete selected"
        >
          <CheckCircle2 size={16} />
          <span className="hidden md:inline">Complete</span>
        </button>

        {/* Flag */}
        <button
          onClick={handleFlag}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            theme === 'dark'
              ? 'hover:bg-orange-500/20 text-gray-300 hover:text-orange-400'
              : 'hover:bg-orange-50 text-gray-600 hover:text-orange-500'
          )}
          title="Toggle flag"
        >
          <Flag size={16} />
          <span className="hidden md:inline">Flag</span>
        </button>

        {/* Due Date */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setShowProjectPicker(false);
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
              theme === 'dark'
                ? 'hover:bg-blue-500/20 text-gray-300 hover:text-blue-400'
                : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
            )}
            title="Set due date"
          >
            <Calendar size={16} />
            <span className="hidden md:inline">Due</span>
            <ChevronDown size={14} />
          </button>

          {showDatePicker && (
            <div className={clsx(
              'absolute bottom-full mb-2 left-0 py-2 rounded-lg shadow-xl border min-w-[160px]',
              theme === 'dark'
                ? 'bg-omnifocus-surface border-omnifocus-border'
                : 'bg-white border-gray-200'
            )}>
              {dateOptions.map(({ label, date, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => handleSetDueDate(date)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                    theme === 'dark'
                      ? 'hover:bg-omnifocus-bg text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <Icon size={14} className="text-gray-400" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProjectPicker(!showProjectPicker);
              setShowDatePicker(false);
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
              theme === 'dark'
                ? 'hover:bg-purple-500/20 text-gray-300 hover:text-purple-400'
                : 'hover:bg-purple-50 text-gray-600 hover:text-purple-600'
            )}
            title="Move to project"
          >
            <FolderOpen size={16} />
            <span className="hidden md:inline">Project</span>
            <ChevronDown size={14} />
          </button>

          {showProjectPicker && (
            <div className={clsx(
              'absolute bottom-full mb-2 left-0 py-2 rounded-lg shadow-xl border min-w-[200px] max-h-64 overflow-y-auto',
              theme === 'dark'
                ? 'bg-omnifocus-surface border-omnifocus-border'
                : 'bg-white border-gray-200'
            )}>
              <button
                onClick={() => handleSetProject(null)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  theme === 'dark'
                    ? 'hover:bg-omnifocus-bg text-gray-400'
                    : 'hover:bg-gray-50 text-gray-500'
                )}
              >
                <X size={14} />
                No Project
              </button>
              {projects.filter(p => p.status === 'active').map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSetProject(project.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
                    theme === 'dark'
                      ? 'hover:bg-omnifocus-bg text-gray-300'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <FolderOpen size={14} className="text-omnifocus-purple shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            theme === 'dark'
              ? 'hover:bg-red-500/20 text-gray-300 hover:text-red-400'
              : 'hover:bg-red-50 text-gray-600 hover:text-red-500'
          )}
          title="Delete selected"
        >
          <Trash2 size={16} />
          <span className="hidden md:inline">Delete</span>
        </button>
      </div>

      {/* Clear selection */}
      <button
        onClick={clearActionSelection}
        className={clsx(
          'ml-2 p-1.5 rounded-lg transition-colors',
          theme === 'dark'
            ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
        )}
        title="Clear selection"
      >
        <X size={18} />
      </button>
    </div>
  );
}
