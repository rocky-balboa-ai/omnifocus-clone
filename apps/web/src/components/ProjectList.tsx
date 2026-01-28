'use client';

import { useAppStore, Project } from '@/stores/app.store';
import { FolderKanban, Flag, Calendar, ChevronRight, Plus, Layers, List, Eye, EyeOff, Search, X, CornerDownLeft, FolderPlus, Focus } from 'lucide-react';
import { ProjectTemplates } from './ProjectTemplates';
import { FolderTree } from './FolderTree';
import { StalledIndicator } from './StalledIndicator';
import clsx from 'clsx';
import { format, isPast, isToday } from 'date-fns';
import { useMemo, useState } from 'react';

interface ProjectItemProps {
  project: Project;
}

function ProjectItem({ project }: ProjectItemProps) {
  const { setSelectedProject, selectedProjectId, setCurrentPerspective, theme, setFocusedProject } = useAppStore();

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
          <StalledIndicator project={project} />
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

      <button
        onClick={(e) => {
          e.stopPropagation();
          setFocusedProject(project.id);
          setCurrentPerspective('inbox');
        }}
        className={clsx(
          'p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
          theme === 'dark'
            ? 'hover:bg-omnifocus-purple/20 text-gray-500 hover:text-omnifocus-purple'
            : 'hover:bg-purple-50 text-gray-400 hover:text-purple-600'
        )}
        title="Focus on this project"
      >
        <Focus size={14} />
      </button>

      <ChevronRight size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
    </li>
  );
}

export function ProjectList() {
  const { projects, isLoading, setQuickEntryOpen, setSearchOpen, showCompleted, setShowCompleted, theme, createProject, selectedFolderId, folders } = useAppStore();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'parallel' | 'sequential' | 'single_actions'>('parallel');
  const [isCreating, setIsCreating] = useState(false);

  const completedCount = projects.filter(p => p.status === 'completed').length;

  // Get selected folder name for breadcrumb
  const selectedFolder = useMemo(() =>
    folders.find(f => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  // Filter projects based on showCompleted state AND selected folder
  const filteredProjects = useMemo(() => {
    let result = showCompleted ? projects : projects.filter(p => p.status === 'active');

    // Filter by folder if one is selected
    if (selectedFolderId) {
      result = result.filter(p => p.folderId === selectedFolderId);
    }

    return result;
  }, [projects, showCompleted, selectedFolderId]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      await createProject({
        name: newProjectName.trim(),
        type: newProjectType,
      });
      setNewProjectName('');
      setShowNewProjectForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project.');
    } finally {
      setIsCreating(false);
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
    <div className="h-full flex">
      {/* Folder Tree Sidebar - hidden on mobile */}
      <div className={clsx(
        'hidden md:block w-56 border-r flex-shrink-0',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <FolderTree />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
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
              {selectedFolder ? selectedFolder.name : 'All Projects'}
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
          onClick={() => setShowTemplates(true)}
          className={clsx(
            'hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
          title="Create from template"
        >
          <FolderPlus size={16} />
          <span className="hidden lg:inline">Templates</span>
        </button>

        <button
          onClick={() => setShowNewProjectForm(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </header>

      {/* New Project Form */}
      {showNewProjectForm && (
        <div className={clsx(
          'mx-4 md:mx-6 mt-3 p-4 rounded-lg border',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="space-y-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateProject();
                } else if (e.key === 'Escape') {
                  setShowNewProjectForm(false);
                  setNewProjectName('');
                }
              }}
              placeholder="Project name..."
              autoFocus
              className={clsx(
                'w-full px-3 py-2 rounded-lg border bg-transparent outline-none text-sm',
                theme === 'dark'
                  ? 'border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple'
                  : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple'
              )}
            />

            <div className="flex items-center gap-2">
              <span className={clsx('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Type:</span>
              {(['parallel', 'sequential', 'single_actions'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewProjectType(type)}
                  className={clsx(
                    'px-3 py-1 rounded text-xs capitalize transition-colors flex items-center gap-1',
                    newProjectType === type
                      ? 'bg-omnifocus-purple text-white'
                      : theme === 'dark'
                        ? 'bg-omnifocus-bg text-gray-400 hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  )}
                >
                  {type === 'parallel' && <Layers size={12} />}
                  {type === 'sequential' && <List size={12} />}
                  {type === 'single_actions' && <FolderKanban size={12} />}
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewProjectForm(false);
                  setNewProjectName('');
                }}
                className={clsx(
                  'px-3 py-1.5 rounded-lg transition-colors text-sm',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-border'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating || !newProjectName.trim()}
                className="px-4 py-1.5 rounded-lg bg-omnifocus-purple text-white text-sm flex items-center gap-2 hover:bg-omnifocus-purple/90 disabled:opacity-50"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CornerDownLeft size={14} />
                    <span>Create Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban size={48} className={clsx('mx-auto mb-4', theme === 'dark' ? 'text-gray-600' : 'text-gray-300')} />
              <p className="text-gray-500">
                {selectedFolder ? `No projects in "${selectedFolder.name}"` : 'No projects yet'}
              </p>
              <p className={clsx('text-sm mt-1', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
                {selectedFolder ? 'Create a project in this folder' : 'Create a project to organize your actions'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredProjects.map((project) => (
                <ProjectItem key={project.id} project={project} />
              ))}
            </ul>
          )}
        </div>

        {/* Project Templates Modal */}
        <ProjectTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
        />
      </div>
    </div>
  );
}
