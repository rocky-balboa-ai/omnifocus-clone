'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  FolderKanban,
  ChevronDown,
  Search,
  X,
  Check,
  Inbox,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';

interface ProjectPickerProps {
  value?: string; // projectId
  onChange: (projectId: string | undefined) => void;
  placeholder?: string;
  showInbox?: boolean;
  showCreate?: boolean;
  className?: string;
}

export function ProjectPicker({
  value,
  onChange,
  placeholder = 'Select project',
  showInbox = true,
  showCreate = false,
  className,
}: ProjectPickerProps) {
  const { theme, projects, createProject } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedProject = value
    ? projects.find(p => p.id === value)
    : null;

  const filteredProjects = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active');
    if (!search.trim()) return activeProjects;
    const lowerSearch = search.toLowerCase();
    return activeProjects.filter(p =>
      p.name.toLowerCase().includes(lowerSearch)
    );
  }, [projects, search]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setIsCreating(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (projectId: string | undefined) => {
    onChange(projectId);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const project = await createProject({
        name: newProjectName.trim(),
        type: 'parallel',
        flagged: false,
      });
      handleSelect(project.id);
      setNewProjectName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedProject
            ? theme === 'dark'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-purple-100 text-purple-600'
            : theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
        )}
      >
        {selectedProject ? (
          <FolderKanban size={14} />
        ) : (
          <Inbox size={14} />
        )}
        <span className="truncate max-w-[120px]">
          {selectedProject ? selectedProject.name : placeholder}
        </span>
        <ChevronDown size={14} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 w-64 rounded-xl shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          {/* Search */}
          <div className={clsx(
            'p-2 border-b',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <div className={clsx(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg',
              theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
            )}>
              <Search size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className={clsx(
                  'flex-1 bg-transparent outline-none text-sm',
                  theme === 'dark'
                    ? 'text-white placeholder-gray-500'
                    : 'text-gray-900 placeholder-gray-400'
                )}
              />
            </div>
          </div>

          {/* Options */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {/* Inbox option */}
            {showInbox && (
              <button
                onClick={() => handleSelect(undefined)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  !value
                    ? theme === 'dark'
                      ? 'bg-omnifocus-surface'
                      : 'bg-gray-100'
                    : theme === 'dark'
                      ? 'hover:bg-omnifocus-surface'
                      : 'hover:bg-gray-100'
                )}
              >
                <Inbox size={16} className="text-blue-500" />
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                  Inbox
                </span>
                {!value && (
                  <Check size={14} className="ml-auto text-omnifocus-purple" />
                )}
              </button>
            )}

            {/* Projects list */}
            {filteredProjects.length === 0 ? (
              <p className={clsx(
                'text-sm text-center py-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {search ? 'No projects found' : 'No active projects'}
              </p>
            ) : (
              filteredProjects.map(project => {
                const isSelected = value === project.id;

                return (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-purple-500/20'
                          : 'bg-purple-100'
                        : theme === 'dark'
                          ? 'hover:bg-omnifocus-surface'
                          : 'hover:bg-gray-100'
                    )}
                  >
                    <FolderKanban size={16} className="text-purple-500 shrink-0" />
                    <span className={clsx(
                      'flex-1 truncate',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {project.name}
                    </span>
                    {project._count?.actions !== undefined && (
                      <span className={clsx(
                        'text-xs',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {project._count.actions}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={14} className="text-omnifocus-purple shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new project */}
          {showCreate && (
            <div className={clsx(
              'p-2 border-t',
              theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
            )}>
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                      if (e.key === 'Escape') setIsCreating(false);
                    }}
                    placeholder="Project name..."
                    autoFocus
                    className={clsx(
                      'flex-1 px-2 py-1.5 rounded border text-sm outline-none',
                      theme === 'dark'
                        ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    )}
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="px-2 py-1.5 rounded bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors',
                    theme === 'dark'
                      ? 'text-omnifocus-purple hover:bg-omnifocus-surface'
                      : 'text-omnifocus-purple hover:bg-gray-100'
                  )}
                >
                  <Plus size={14} />
                  Create new project
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
