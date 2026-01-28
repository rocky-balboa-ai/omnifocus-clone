'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Command,
  X,
  FolderKanban,
  Tags,
  Inbox,
  Calendar,
  Eye,
  Flag,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuickOpenItem = {
  id: string;
  type: 'perspective' | 'project' | 'tag';
  name: string;
  icon: React.ReactNode;
};

const PERSPECTIVES: QuickOpenItem[] = [
  { id: 'inbox', type: 'perspective', name: 'Inbox', icon: <Inbox size={16} /> },
  { id: 'forecast', type: 'perspective', name: 'Forecast', icon: <Calendar size={16} /> },
  { id: 'projects', type: 'perspective', name: 'Projects', icon: <FolderKanban size={16} /> },
  { id: 'tags', type: 'perspective', name: 'Tags', icon: <Tags size={16} /> },
  { id: 'review', type: 'perspective', name: 'Review', icon: <Eye size={16} /> },
  { id: 'flagged', type: 'perspective', name: 'Flagged', icon: <Flag size={16} /> },
  { id: 'available', type: 'perspective', name: 'Available', icon: <CheckCircle2 size={16} /> },
];

export function QuickOpen({ isOpen, onClose }: QuickOpenProps) {
  const {
    theme,
    projects,
    tags,
    setCurrentPerspective,
    setSelectedProject,
    setFocusedTag,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build all items list
  const allItems = useMemo(() => {
    const items: QuickOpenItem[] = [...PERSPECTIVES];

    // Add active projects
    projects
      .filter((p) => p.status === 'active')
      .forEach((p) => {
        items.push({
          id: p.id,
          type: 'project',
          name: p.name,
          icon: <Layers size={16} className="text-blue-400" />,
        });
      });

    // Add tags
    tags.forEach((t) => {
      items.push({
        id: t.id,
        type: 'tag',
        name: t.name,
        icon: <Tags size={16} className="text-green-400" />,
      });
    });

    return items;
  }, [projects, tags]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;

    const lowerQuery = query.toLowerCase();
    return allItems.filter((item) => item.name.toLowerCase().includes(lowerQuery));
  }, [allItems, query]);

  // Group filtered items by type
  const groupedItems = useMemo(() => {
    const groups: { perspectives: QuickOpenItem[]; projects: QuickOpenItem[]; tags: QuickOpenItem[] } = {
      perspectives: [],
      projects: [],
      tags: [],
    };

    filteredItems.forEach((item) => {
      if (item.type === 'perspective') groups.perspectives.push(item);
      else if (item.type === 'project') groups.projects.push(item);
      else if (item.type === 'tag') groups.tags.push(item);
    });

    return groups;
  }, [filteredItems]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    return [
      ...groupedItems.perspectives,
      ...groupedItems.projects,
      ...groupedItems.tags,
    ];
  }, [groupedItems]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatList.length > 0) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedElement && typeof selectedElement.scrollIntoView === 'function') {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, flatList.length]);

  const handleSelect = useCallback(
    (item: QuickOpenItem) => {
      switch (item.type) {
        case 'perspective':
          setCurrentPerspective(item.id as any);
          break;
        case 'project':
          setCurrentPerspective('projects');
          setSelectedProject(item.id);
          break;
        case 'tag':
          setFocusedTag(item.id);
          setCurrentPerspective('inbox');
          break;
      }
      onClose();
    },
    [setCurrentPerspective, setSelectedProject, setFocusedTag, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[selectedIndex]) {
            handleSelect(flatList[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatList, selectedIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  // Calculate global index for each item
  let globalIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Quick Open Modal */}
      <div
        className={clsx(
          'fixed z-50 overflow-hidden shadow-2xl',
          theme === 'dark' ? 'bg-omnifocus-sidebar border-omnifocus-border' : 'bg-white border-gray-200',
          'border',
          // Mobile: full width with padding
          'inset-x-4 top-20',
          // Desktop: centered, narrower
          'md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:top-24',
          'rounded-xl'
        )}
      >
        {/* Search Input */}
        <div
          className={clsx(
            'flex items-center gap-3 px-4 py-3 border-b',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}
        >
          <Command size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className={clsx(
              'flex-1 bg-transparent placeholder-gray-500 outline-none text-base',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
            placeholder="Go to..."
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={clsx(
                'p-1 rounded transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
              )}
            >
              <X size={16} />
            </button>
          )}
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
            <kbd
              className={clsx(
                'px-1.5 py-0.5 rounded',
                theme === 'dark' ? 'bg-omnifocus-surface text-gray-400' : 'bg-gray-100 text-gray-500'
              )}
            >
              ⌘O
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {flatList.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">No results found</div>
          )}

          {/* Perspectives */}
          {groupedItems.perspectives.length > 0 && (
            <div className="mb-2">
              <div
                className={clsx(
                  'px-4 py-1 text-xs font-medium uppercase tracking-wider',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                Perspectives
              </div>
              {groupedItems.perspectives.map((item) => {
                const index = globalIndex++;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-omnifocus-purple/20'
                        : theme === 'dark'
                        ? 'hover:bg-omnifocus-surface'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <span className="text-omnifocus-purple">{item.icon}</span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Projects */}
          {groupedItems.projects.length > 0 && (
            <div className="mb-2">
              <div
                className={clsx(
                  'px-4 py-1 text-xs font-medium uppercase tracking-wider',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                Projects
              </div>
              {groupedItems.projects.map((item) => {
                const index = globalIndex++;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-omnifocus-purple/20'
                        : theme === 'dark'
                        ? 'hover:bg-omnifocus-surface'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    {item.icon}
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {groupedItems.tags.length > 0 && (
            <div className="mb-2">
              <div
                className={clsx(
                  'px-4 py-1 text-xs font-medium uppercase tracking-wider',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                Tags
              </div>
              {groupedItems.tags.map((item) => {
                const index = globalIndex++;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-omnifocus-purple/20'
                        : theme === 'dark'
                        ? 'hover:bg-omnifocus-surface'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    {item.icon}
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className={clsx(
            'hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t text-xs text-gray-500',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}
        >
          <span className="flex items-center gap-1">
            <kbd
              className={clsx('px-1.5 py-0.5 rounded', theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100')}
            >
              ↑
            </kbd>
            <kbd
              className={clsx('px-1.5 py-0.5 rounded', theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100')}
            >
              ↓
            </kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd
              className={clsx('px-1.5 py-0.5 rounded', theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100')}
            >
              ↵
            </kbd>
            <span>select</span>
          </span>
        </div>
      </div>
    </>
  );
}
