'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { api } from '@/lib/api';
import { Search, X, FolderKanban, Tags, CheckCircle2, Command, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface SearchCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  type: 'action' | 'project' | 'tag';
  title: string;
  subtitle?: string;
};

export function SearchCommand({ isOpen, onClose }: SearchCommandProps) {
  const { actions, projects, tags, setSelectedAction, setSelectedProject, setCurrentPerspective, theme } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Search logic with API call and debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    const abortController = new AbortController();
    searchAbortRef.current = abortController;

    setIsLoading(true);

    // Debounce API call
    const timeoutId = setTimeout(async () => {
      try {
        // Try API search first
        const apiResult = await api.get<{
          actions: Array<{ id: string; title: string; project?: { name: string } }>;
          projects: Array<{ id: string; name: string; _count?: { actions: number } }>;
          tags: Array<{ id: string; name: string; _count?: { actions: number } }>;
        }>(`/actions/search?q=${encodeURIComponent(query)}&limit=20`);

        if (abortController.signal.aborted) return;

        const searchResults: SearchResult[] = [];

        // Add actions
        apiResult.actions.slice(0, 8).forEach(a => {
          searchResults.push({
            id: a.id,
            type: 'action',
            title: a.title,
            subtitle: a.project?.name,
          });
        });

        // Add projects
        apiResult.projects.slice(0, 4).forEach(p => {
          searchResults.push({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: `${p._count?.actions || 0} actions`,
          });
        });

        // Add tags
        apiResult.tags.slice(0, 4).forEach(t => {
          searchResults.push({
            id: t.id,
            type: 'tag',
            title: t.name,
            subtitle: `${t._count?.actions || 0} actions`,
          });
        });

        setResults(searchResults);
        setSelectedIndex(0);
      } catch {
        // Fallback to client-side search if API fails
        if (abortController.signal.aborted) return;

        const lowerQuery = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        actions
          .filter(a => a.title.toLowerCase().includes(lowerQuery))
          .slice(0, 5)
          .forEach(a => {
            searchResults.push({
              id: a.id,
              type: 'action',
              title: a.title,
              subtitle: a.project?.name,
            });
          });

        projects
          .filter(p => p.name.toLowerCase().includes(lowerQuery))
          .slice(0, 3)
          .forEach(p => {
            searchResults.push({
              id: p.id,
              type: 'project',
              title: p.name,
              subtitle: `${p._count?.actions || 0} actions`,
            });
          });

        tags
          .filter(t => t.name.toLowerCase().includes(lowerQuery))
          .slice(0, 3)
          .forEach(t => {
            searchResults.push({
              id: t.id,
              type: 'tag',
              title: t.name,
              subtitle: `${t._count?.actions || 0} actions`,
            });
          });

        setResults(searchResults);
        setSelectedIndex(0);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 150); // 150ms debounce

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query, actions, projects, tags]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  const handleSelect = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'action':
        setSelectedAction(result.id);
        break;
      case 'project':
        setCurrentPerspective('projects');
        setSelectedProject(result.id);
        break;
      case 'tag':
        setCurrentPerspective('tags');
        break;
    }
    onClose();
  }, [setSelectedAction, setSelectedProject, setCurrentPerspective, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: 'action' | 'project' | 'tag') => {
    switch (type) {
      case 'action':
        return <CheckCircle2 size={16} className="text-omnifocus-purple" />;
      case 'project':
        return <FolderKanban size={16} className="text-blue-400" />;
      case 'tag':
        return <Tags size={16} className="text-green-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className={clsx(
        'fixed z-50 overflow-hidden shadow-2xl',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200',
        'border',
        // Mobile: full width with padding
        'inset-x-4 top-20',
        // Desktop: centered, narrower
        'md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[560px] md:top-24',
        'rounded-xl'
      )}>
        {/* Search Input */}
        <div className={clsx(
          'flex items-center gap-3 px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={clsx(
              'flex-1 bg-transparent placeholder-gray-500 outline-none text-base',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
            placeholder="Search actions, projects, tags..."
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
            <kbd className={clsx(
              'px-1.5 py-0.5 rounded',
              theme === 'dark' ? 'bg-omnifocus-surface text-gray-400' : 'bg-gray-100 text-gray-500'
            )}>esc</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 flex items-center justify-center text-gray-500">
              <Loader2 size={20} className="animate-spin mr-2" />
              Searching...
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!isLoading && results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-omnifocus-purple/20'
                  : theme === 'dark'
                    ? 'hover:bg-omnifocus-surface'
                    : 'hover:bg-gray-100'
              )}
            >
              {getIcon(result.type)}
              <div className="flex-1 min-w-0">
                <p className={clsx('truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>{result.title}</p>
                {result.subtitle && (
                  <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                )}
              </div>
              <span className="text-xs text-gray-500 capitalize shrink-0">
                {result.type}
              </span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        {!query && (
          <div className={clsx(
            'px-4 py-3 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <p className="text-sm text-gray-500 text-center">
              Start typing to search...
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className={clsx(
            'hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t text-xs text-gray-500',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <span className="flex items-center gap-1">
              <kbd className={clsx('px-1.5 py-0.5 rounded', theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100')}>↑</kbd>
              <kbd className={clsx('px-1.5 py-0.5 rounded', theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100')}>↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className={clsx('px-1.5 py-0.5 rounded', theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100')}>↵</kbd>
              <span>select</span>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
