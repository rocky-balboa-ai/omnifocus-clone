'use client';

import { useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore, Folder, Project } from '@/stores/app.store';
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderKanban } from 'lucide-react';
import clsx from 'clsx';

interface ProjectTreeProps {
  theme: 'light' | 'dark';
}

const themeClasses = {
  sectionTitle: {
    dark: 'text-gray-500',
    light: 'text-gray-400',
  },
  item: {
    active: 'bg-omnifocus-purple text-white',
    inactive: {
      dark: 'text-gray-400 hover:bg-omnifocus-surface hover:text-white',
      light: 'text-gray-600 hover:bg-omnifocus-light-surface hover:text-gray-900',
    },
  },
  count: {
    dark: 'bg-omnifocus-surface text-gray-400',
    light: 'bg-gray-200 text-gray-600',
  },
};

function FolderItem({
  folder,
  projects,
  allFolders,
  level,
  theme,
  expandedFolders,
  toggleFolder,
  focusedProjectId,
  setFocusedProject,
}: {
  folder: Folder;
  projects: Project[];
  allFolders: Folder[];
  level: number;
  theme: 'light' | 'dark';
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  focusedProjectId: string | null;
  setFocusedProject: (id: string) => void;
}) {
  const isExpanded = expandedFolders.has(folder.id);
  const childFolders = allFolders.filter(f => f.parentId === folder.id);
  const folderProjects = projects.filter(p => p.folderId === folder.id && p.status === 'active');
  const hasChildren = childFolders.length > 0 || folderProjects.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && toggleFolder(folder.id)}
        className={clsx(
          'w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors',
          themeClasses.item.inactive[theme]
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <span className="w-3.5" />
        )}
        <FolderIcon size={16} className="text-yellow-500" />
        <span className="flex-1 text-left truncate">{folder.name}</span>
      </button>

      {isExpanded && (
        <>
          {childFolders.map(childFolder => (
            <FolderItem
              key={childFolder.id}
              folder={childFolder}
              projects={projects}
              allFolders={allFolders}
              level={level + 1}
              theme={theme}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              focusedProjectId={focusedProjectId}
              setFocusedProject={setFocusedProject}
            />
          ))}
          {folderProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              level={level + 1}
              theme={theme}
              isActive={focusedProjectId === project.id}
              onClick={() => setFocusedProject(project.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function ProjectItem({
  project,
  level,
  theme,
  isActive,
  onClick,
}: {
  project: Project;
  level: number;
  theme: 'light' | 'dark';
  isActive: boolean;
  onClick: () => void;
}) {
  const actionCount = project._count?.actions || 0;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors',
        isActive ? themeClasses.item.active : themeClasses.item.inactive[theme]
      )}
      style={{ paddingLeft: `${level * 12 + 8 + 18}px` }}
    >
      <FolderKanban size={16} className={isActive ? 'text-white' : 'text-omnifocus-purple'} />
      <span className="flex-1 text-left truncate">{project.name}</span>
      {actionCount > 0 && (
        <span className={clsx(
          'px-1.5 py-0.5 text-xs rounded-full font-medium',
          isActive ? 'bg-white/20' : themeClasses.count[theme]
        )}>
          {actionCount}
        </span>
      )}
    </button>
  );
}

export function ProjectTree({ theme }: ProjectTreeProps) {
  const { projects, folders, setCurrentPerspective } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const isProjectsActive = pathname === '/projects' || pathname.startsWith('/projects/');
  const activeProjectId = pathname.startsWith('/projects/') ? pathname.split('/')[2] : null;

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get root folders and projects
  const rootFolders = useMemo(() => folders.filter(f => !f.parentId), [folders]);
  const rootProjects = useMemo(() =>
    projects.filter(p => !p.folderId && p.status === 'active'),
    [projects]
  );

  const handleProjectClick = (projectId: string) => {
    setCurrentPerspective('projects');
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1 px-3 mb-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={clsx('p-0.5 rounded hover:bg-gray-700/30', themeClasses.sectionTitle[theme])}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentPerspective('projects');
            window.history.pushState({}, '', '/projects');
            router.refresh();
          }}
          className={clsx(
            'text-xs font-semibold uppercase tracking-wider transition-colors flex-1 py-1 -my-1 text-left cursor-pointer',
            isProjectsActive
              ? 'text-omnifocus-purple'
              : themeClasses.sectionTitle[theme],
            'hover:text-omnifocus-purple'
          )}
        >
          Projects
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {rootFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              projects={projects}
              allFolders={folders}
              level={0}
              theme={theme}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              focusedProjectId={activeProjectId}
              setFocusedProject={handleProjectClick}
            />
          ))}
          {rootProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              level={0}
              theme={theme}
              isActive={activeProjectId === project.id}
              onClick={() => handleProjectClick(project.id)}
            />
          ))}
          {rootFolders.length === 0 && rootProjects.length === 0 && (
            <p className={clsx('px-3 text-xs', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
              No projects yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
