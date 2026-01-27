'use client';

import { useAppStore, Project } from '@/stores/app.store';
import { FolderKanban, Flag, Calendar, ChevronRight, Plus, Layers, List } from 'lucide-react';
import clsx from 'clsx';
import { format, isPast, isToday } from 'date-fns';

interface ProjectItemProps {
  project: Project;
}

function ProjectItem({ project }: ProjectItemProps) {
  const { setSelectedProject, selectedProjectId, setCurrentPerspective } = useAppStore();

  const isSelected = selectedProjectId === project.id;
  const isDueSoon = project.dueDate && (isToday(new Date(project.dueDate)) || isPast(new Date(project.dueDate)));

  const typeIcon = project.type === 'sequential' ? List : project.type === 'parallel' ? Layers : FolderKanban;
  const TypeIcon = typeIcon;

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
          : 'hover:bg-omnifocus-surface border border-transparent'
      )}
    >
      <TypeIcon size={18} className="text-blue-400 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'text-sm',
              project.status === 'completed' ? 'line-through text-gray-500' : 'text-white'
            )}
          >
            {project.name}
          </span>
          {project.flagged && <Flag size={14} className="text-omnifocus-orange" />}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{project._count?.actions || 0} actions</span>

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

      <ChevronRight size={16} className="text-gray-500 shrink-0" />
    </li>
  );
}

export function ProjectList() {
  const { projects, isLoading, setQuickEntryOpen } = useAppStore();

  // Filter out completed projects by default
  const activeProjects = projects.filter(p => p.status === 'active');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-omnifocus-border safe-area-top flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          Projects
        </h2>
        <button
          onClick={() => setQuickEntryOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {activeProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No projects yet</p>
            <p className="text-sm text-gray-600 mt-1">Create a project to organize your actions</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {activeProjects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
