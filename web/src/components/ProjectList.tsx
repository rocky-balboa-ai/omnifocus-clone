'use client';

import { useAppStore, Project } from '@/stores/app.store';
import { FolderKanban, Flag, Calendar, ChevronRight, Plus, Layers, List, Eye, EyeOff, Search } from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday } from 'date-fns';
import { useMemo } from 'react';

interface ProjectItemProps {
  project: Project;
}

function ProjectItem({ project }: ProjectItemProps) {
  const { setSelectedProject, selectedProjectId, setCurrentPerspective, theme } = useAppStore();

  const isSelected = selectedProjectId === project.id;
  const isDueSoon = project.dueDate && (isToday(new Date(project.dueDate)) || isPast(new Date(project.dueDate)));

  const typeIcon = project.type === 'sequential' ? List : project.type === 'parallel' ? Layers : FolderKanban;
  const TypeIcon = typeIcon;

  const totalActions = project._count?.actions || 0;
  const completedActions = project._count?.completedActions || 0;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const handleClick = () => {
    setSelectedProject(project.id);
  };

  return (
    <li
      onClick={handleClick}
      className={clsx(
        'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-omnifocus-purple/20 border border-omnifocus-purple'
          : theme === 'dark'
            ? 'hover:bg-omnifocus-surface border border-transparent'
            : 'hover:bg-gray-100 border border-transparent'
      )}
    >
      <TypeIcon size={18} className="text-blue-400 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'text-sm',
              project.status === 'completed'
                ? 'line-through text-gray-500'
                : theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
          >
            {project.name}
          </span>
          {project.flagged && <Flag size={14} className="text-omnifocus-orange" />}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {totalActions > 0 ? (
            <div className="flex items-center gap-2">
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
              <span>{completedActions}/{totalActions}</span>
            </div>
          ) : (
            <span>No actions</span>
          )}

          {project.dueDate && (
            <span
              className={clsx(
                'flex items-center gap-1',
                isDueSoon && 'text-red-400'
              )}
            >
              <Calendar size={12} />
              {format(new Date(project.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
    </li>
  );
}

export function ProjectList() {
  const { projects, isLoading, setQuickEntryOpen, setSearchOpen, showCompleted, setShowCompleted, theme } = useAppStore();

  const completedCount = projects.filter(p => p.status === 'completed').length;

  // Filter projects based on showCompleted state
  const filteredProjects = useMemo(() => {
    return showCompleted ? projects : projects.filter(p => p.status === 'active');
  }, [projects, showCompleted]);

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
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3 flex-1">
          <FolderKanban size={24} className="text-blue-400" />
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Projects
          </h2>
        </div>

        {/* Show/Hide Completed toggle */}
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

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
        >
          <Search size={16} />
          <kbd className={clsx(
            'hidden md:inline px-1.5 py-0.5 text-xs rounded',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white border border-gray-200'
          )}>⌘K</kbd>
        </button>

        <button
          onClick={() => setQuickEntryOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban size={48} className={clsx('mx-auto mb-4', theme === 'dark' ? 'text-gray-600' : 'text-gray-300')} />
            <p className="text-gray-500">No projects yet</p>
            <p className={clsx('text-sm mt-1', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>Create a project to organize your actions</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredProjects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
