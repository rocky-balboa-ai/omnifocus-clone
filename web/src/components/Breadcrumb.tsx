'use client';

import { useAppStore } from '@/stores/app.store';
import { ChevronRight, Home, Folder, FolderOpen, Tag, Flag, Calendar, Inbox } from 'lucide-react';
import clsx from 'clsx';

interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: typeof Home;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const { theme } = useAppStore();

  if (items.length === 0) return null;

  return (
    <nav className={clsx('flex items-center gap-1 flex-wrap', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={item.id} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight
                size={14}
                className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}
              />
            )}
            <button
              onClick={item.onClick}
              disabled={isLast}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors',
                isLast
                  ? theme === 'dark'
                    ? 'text-white font-medium cursor-default'
                    : 'text-gray-900 font-medium cursor-default'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {Icon && <Icon size={14} />}
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

// Perspective breadcrumb (auto-generated from current perspective)
export function PerspectiveBreadcrumb({ className }: { className?: string }) {
  const {
    theme,
    currentPerspective,
    setCurrentPerspective,
    selectedProjectId,
    projects,
    filterTagId,
    tags,
  } = useAppStore();

  const perspectiveIcons: Record<string, typeof Home> = {
    inbox: Inbox,
    projects: Folder,
    tags: Tag,
    flagged: Flag,
    forecast: Calendar,
  };

  const perspectiveLabels: Record<string, string> = {
    inbox: 'Inbox',
    projects: 'Projects',
    tags: 'Tags',
    flagged: 'Flagged',
    forecast: 'Forecast',
    review: 'Review',
    today: 'Today',
    all: 'All Actions',
  };

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => setCurrentPerspective('inbox'),
    },
  ];

  // Current perspective
  if (currentPerspective) {
    items.push({
      id: currentPerspective,
      label: perspectiveLabels[currentPerspective] || currentPerspective,
      icon: perspectiveIcons[currentPerspective],
      onClick: selectedProjectId || filterTagId
        ? () => setCurrentPerspective(currentPerspective)
        : undefined,
    });
  }

  // Selected project
  if (selectedProjectId && currentPerspective === 'projects') {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      items.push({
        id: project.id,
        label: project.name,
        icon: FolderOpen,
      });
    }
  }

  // Selected tag
  if (filterTagId && currentPerspective === 'tags') {
    const tag = tags.find(t => t.id === filterTagId);
    if (tag) {
      items.push({
        id: tag.id,
        label: tag.name,
        icon: Tag,
      });
    }
  }

  return <Breadcrumb items={items} className={className} />;
}

// Simple text breadcrumb
interface TextBreadcrumbProps {
  segments: string[];
  separator?: string;
  className?: string;
}

export function TextBreadcrumb({ segments, separator = '/', className }: TextBreadcrumbProps) {
  const { theme } = useAppStore();

  return (
    <span className={clsx(
      'text-sm',
      theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
      className
    )}>
      {segments.map((segment, index) => (
        <span key={index}>
          {index > 0 && (
            <span className="mx-1.5">{separator}</span>
          )}
          <span className={index === segments.length - 1
            ? theme === 'dark' ? 'text-white' : 'text-gray-900'
            : ''
          }>
            {segment}
          </span>
        </span>
      ))}
    </span>
  );
}

// Folder path breadcrumb (for nested projects)
interface FolderBreadcrumbProps {
  path: Array<{ id: string; name: string }>;
  onNavigate: (id: string) => void;
  className?: string;
}

export function FolderBreadcrumb({ path, onNavigate, className }: FolderBreadcrumbProps) {
  const { theme } = useAppStore();

  if (path.length === 0) return null;

  return (
    <nav className={clsx('flex items-center gap-1', className)}>
      {path.map((folder, index) => {
        const isLast = index === path.length - 1;

        return (
          <div key={folder.id} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight
                size={12}
                className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}
              />
            )}
            <button
              onClick={() => !isLast && onNavigate(folder.id)}
              disabled={isLast}
              className={clsx(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors',
                isLast
                  ? theme === 'dark'
                    ? 'text-gray-300 cursor-default'
                    : 'text-gray-700 cursor-default'
                  : theme === 'dark'
                    ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {index === 0 ? (
                <Folder size={12} />
              ) : (
                <FolderOpen size={12} />
              )}
              <span className="max-w-24 truncate">{folder.name}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
