'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Search, X, FolderKanban, Tags, CheckCircle2, Command } from 'lucide-react';
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
  const { actions, projects, tags, setSelectedAction, setSelectedProject, setCurrentPerspective } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search actions
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

    // Search projects
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

    // Search tags
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
        'fixed z-50 bg-omnifocus-sidebar border border-omnifocus-border overflow-hidden shadow-2xl',
        // Mobile: full width with padding
        'inset-x-4 top-20',
        // Desktop: centered, narrower
        'md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[560px] md:top-24',
        'rounded-xl'
      )}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-omnifocus-border">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
            placeholder="Search actions, projects, tags..."
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-omnifocus-surface text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-omnifocus-surface rounded text-gray-400">esc</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-omnifocus-purple/20'
                  : 'hover:bg-omnifocus-surface'
              )}
            >
              {getIcon(result.type)}
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{result.title}</p>
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
          <div className="px-4 py-3 border-t border-omnifocus-border">
            <p className="text-sm text-gray-500 text-center">
              Start typing to search...
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t border-omnifocus-border text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-omnifocus-surface rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-omnifocus-surface rounded">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-omnifocus-surface rounded">↵</kbd>
              <span>select</span>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
