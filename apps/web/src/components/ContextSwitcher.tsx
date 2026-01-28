'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  RefreshCw,
  Sun,
  BarChart3,
  ChevronDown,
  Check,
  Search,
} from 'lucide-react';
import clsx from 'clsx';

const PERSPECTIVES = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, color: 'text-blue-500' },
  { id: 'projects', name: 'Projects', icon: FolderKanban, color: 'text-purple-500' },
  { id: 'tags', name: 'Tags', icon: Tags, color: 'text-green-500' },
  { id: 'forecast', name: 'Forecast', icon: Calendar, color: 'text-orange-500' },
  { id: 'flagged', name: 'Flagged', icon: Flag, color: 'text-orange-400' },
  { id: 'review', name: 'Review', icon: RefreshCw, color: 'text-teal-500' },
  { id: 'today', name: 'Today', icon: Sun, color: 'text-yellow-500' },
  { id: 'stats', name: 'Statistics', icon: BarChart3, color: 'text-indigo-500' },
];

interface ContextSwitcherProps {
  className?: string;
}

export function ContextSwitcher({ className }: ContextSwitcherProps) {
  const { currentPerspective, setCurrentPerspective, theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const currentPerspectiveData = PERSPECTIVES.find(p => p.id === currentPerspective) || PERSPECTIVES[0];
  const Icon = currentPerspectiveData.icon;

  const filteredPerspectives = PERSPECTIVES.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (perspectiveId: string) => {
    setCurrentPerspective(perspectiveId);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Enter' && filteredPerspectives.length > 0) {
      handleSelect(filteredPerspectives[0].id);
    }
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
          theme === 'dark'
            ? 'bg-omnifocus-surface hover:bg-omnifocus-border text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900',
          isOpen && 'ring-2 ring-omnifocus-purple'
        )}
      >
        <Icon size={18} className={currentPerspectiveData.color} />
        <span className="font-medium">{currentPerspectiveData.name}</span>
        <ChevronDown
          size={16}
          className={clsx(
            'transition-transform',
            isOpen && 'rotate-180',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-50',
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
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
            )}>
              <Search size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search perspectives..."
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
            {filteredPerspectives.length === 0 ? (
              <p className={clsx(
                'text-sm text-center py-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                No perspectives found
              </p>
            ) : (
              <div className="space-y-1">
                {filteredPerspectives.map(perspective => {
                  const PerspectiveIcon = perspective.icon;
                  const isSelected = currentPerspective === perspective.id;

                  return (
                    <button
                      key={perspective.id}
                      onClick={() => handleSelect(perspective.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        isSelected
                          ? theme === 'dark'
                            ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                            : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                          : theme === 'dark'
                            ? 'hover:bg-omnifocus-surface text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      <PerspectiveIcon size={18} className={perspective.color} />
                      <span className="flex-1 text-sm font-medium">
                        {perspective.name}
                      </span>
                      {isSelected && (
                        <Check size={16} className="text-omnifocus-purple" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Keyboard hint */}
          <div className={clsx(
            'px-3 py-2 border-t text-xs',
            theme === 'dark'
              ? 'border-omnifocus-border text-gray-600'
              : 'border-gray-200 text-gray-400'
          )}>
            <kbd className={clsx(
              'px-1 py-0.5 rounded text-[10px]',
              theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
            )}>↵</kbd> to select,{' '}
            <kbd className={clsx(
              'px-1 py-0.5 rounded text-[10px]',
              theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
            )}>Esc</kbd> to close
          </div>
        </div>
      )}
    </div>
  );
}
