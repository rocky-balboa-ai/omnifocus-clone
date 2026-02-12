'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore, Action, Project } from '@/stores/app.store';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
  Clock,
  Layers,
  List,
  FolderKanban,
  Eye,
  EyeOff,
  CornerDownLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday } from 'date-fns';

interface ProjectWithActions extends Project {
  actions?: Action[];
}

export function ProjectDetailView() {
  const {
    viewingProjectId,
    setViewingProject,
    setSelectedAction,
    selectedActionId,
    completeAction,
    uncompleteAction,
    theme,
    createAction,
    fetchProjects,
  } = useAppStore();

  const [project, setProject] = useState<ProjectWithActions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!viewingProjectId) return;
    setIsLoading(true);
    try {
      const data = await api.get<ProjectWithActions>(`/projects/${viewingProjectId}`);
      setProject(data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewingProjectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Refetch when selected action changes (user may have edited a task)
  useEffect(() => {
    if (!selectedActionId) {
      fetchProject();
    }
  }, [selectedActionId, fetchProject]);

  const allActions = project?.actions || [];
  const completedCount = allActions.filter(a => a.status === 'completed').length;
  const activeActions = useMemo(
    () => showCompleted ? allActions : allActions.filter(a => a.status !== 'completed'),
    [allActions, showCompleted]
  );

  const totalActions = allActions.length;
  const progressPercent = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  const typeIcon = project?.type === 'sequential' ? List : project?.type === 'parallel' ? Layers : FolderKanban;
  const TypeIcon = typeIcon;

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !viewingProjectId) return;
    setIsCreating(true);
    try {
      await createAction({
        title: newTaskTitle.trim(),
        projectId: viewingProjectId,
      });
      setNewTaskTitle('');
      setShowNewTaskForm(false);
      await fetchProject();
      await fetchProjects();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (action: Action) => {
    try {
      if (action.status === 'completed') {
        await uncompleteAction(action.id);
      } else {
        await completeAction(action.id);
      }
      await fetchProject();
      await fetchProjects();
    } catch (error) {
      console.error('Failed to toggle action:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">Project not found</p>
        <button
          onClick={() => setViewingProject(null)}
          className="text-omnifocus-purple hover:underline"
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className={clsx(
        'px-4 md:px-6 py-3 md:py-4 border-b safe-area-top',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewingProject(null)}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            )}
            title="Back to projects"
          >
            <ArrowLeft size={20} />
          </button>

          <TypeIcon size={20} className="text-blue-400 shrink-0" />

          <div className="flex-1 min-w-0">
            <h2 className={clsx(
              'text-xl md:text-2xl font-semibold truncate',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {project.name}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={clsx('text-xs capitalize', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                {project.type.replace('_', ' ')}
              </span>
              {totalActions > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={clsx(
                    'w-16 h-1.5 rounded-full overflow-hidden',
                    theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
                  )}>
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        progressPercent === 100 ? 'bg-green-500' : 'bg-omnifocus-purple'
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span>{completedCount}/{totalActions}</span>
                </div>
              )}
            </div>
          </div>

          {/* Show/Hide Completed */}
          {completedCount > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
                showCompleted
                  ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                    : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              )}
              title={showCompleted ? 'Hide completed' : 'Show completed'}
            >
              {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="hidden md:inline">{completedCount}</span>
            </button>
          )}

          {/* New Task button */}
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
          >
            <Plus size={16} />
            <span className="hidden md:inline">New Task</span>
          </button>
        </div>
      </header>

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className={clsx(
          'mx-4 md:mx-6 mt-3 p-4 rounded-lg border',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTask();
                } else if (e.key === 'Escape') {
                  setShowNewTaskForm(false);
                  setNewTaskTitle('');
                }
              }}
              placeholder="Task title..."
              autoFocus
              className={clsx(
                'flex-1 px-3 py-2 rounded-lg border bg-transparent outline-none text-sm',
                theme === 'dark'
                  ? 'border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple'
                  : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple'
              )}
            />
            <button
              onClick={handleCreateTask}
              disabled={isCreating || !newTaskTitle.trim()}
              className="px-4 py-2 rounded-lg bg-omnifocus-purple text-white text-sm flex items-center gap-2 hover:bg-omnifocus-purple/90 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CornerDownLeft size={14} />
                  <span>Add</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowNewTaskForm(false);
                setNewTaskTitle('');
              }}
              className={clsx(
                'px-3 py-2 rounded-lg transition-colors text-sm',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {activeActions.length === 0 ? (
          <div className="text-center py-12">
            <Circle size={48} className={clsx('mx-auto mb-4', theme === 'dark' ? 'text-gray-600' : 'text-gray-300')} />
            <p className="text-gray-500">
              {totalActions === 0 ? 'No tasks yet' : 'All tasks completed'}
            </p>
            <p className={clsx('text-sm mt-1', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
              {totalActions === 0 ? 'Add a task to get started' : 'Toggle completed to see them'}
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {activeActions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                theme={theme}
                onToggleComplete={handleToggleComplete}
                onSelect={setSelectedAction}
                isSelected={selectedActionId === action.id}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ActionRowProps {
  action: Action;
  theme: 'light' | 'dark';
  onToggleComplete: (action: Action) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  depth?: number;
}

function ActionRow({ action, theme, onToggleComplete, onSelect, isSelected, depth = 0 }: ActionRowProps) {
  const isCompleted = action.status === 'completed';
  const isDueSoon = action.dueDate && (isToday(new Date(action.dueDate)) || isPast(new Date(action.dueDate)));

  return (
    <>
      <li
        onClick={() => onSelect(action.id)}
        className={clsx(
          'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-omnifocus-purple/20 border border-omnifocus-purple'
            : theme === 'dark'
              ? 'hover:bg-omnifocus-surface border border-transparent'
              : 'hover:bg-gray-100 border border-transparent'
        )}
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        {/* Completion toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(action);
          }}
          className={clsx(
            'shrink-0 transition-colors',
            isCompleted
              ? 'text-green-500'
              : theme === 'dark'
                ? 'text-gray-500 hover:text-omnifocus-purple'
                : 'text-gray-400 hover:text-omnifocus-purple'
          )}
        >
          {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>

        {/* Title */}
        <span
          className={clsx(
            'flex-1 text-sm min-w-0 truncate',
            isCompleted
              ? 'line-through text-gray-500'
              : theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}
        >
          {action.title}
        </span>

        {/* Metadata */}
        <div className="flex items-center gap-2 shrink-0">
          {action.flagged && <Flag size={14} className="text-omnifocus-orange" />}

          {action.estimatedMinutes && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              {action.estimatedMinutes}m
            </span>
          )}

          {action.dueDate && (
            <span
              className={clsx(
                'flex items-center gap-1 text-xs',
                isDueSoon ? 'text-red-400' : 'text-gray-500'
              )}
            >
              <Calendar size={12} />
              {format(new Date(action.dueDate), 'MMM d')}
            </span>
          )}

          {action.tags && action.tags.length > 0 && (
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded',
              theme === 'dark' ? 'bg-omnifocus-surface text-gray-400' : 'bg-gray-100 text-gray-500'
            )}>
              {action.tags[0].tag?.name || 'tag'}
              {action.tags.length > 1 && ` +${action.tags.length - 1}`}
            </span>
          )}
        </div>
      </li>

      {/* Render children */}
      {action.children?.map((child) => (
        <ActionRow
          key={child.id}
          action={child}
          theme={theme}
          onToggleComplete={onToggleComplete}
          onSelect={onSelect}
          isSelected={isSelected}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
