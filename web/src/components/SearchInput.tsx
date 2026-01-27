'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Search,
  X,
  Clock,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showHistory?: boolean;
  showClear?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

const HISTORY_KEY = 'omnifocus-search-history';
const MAX_HISTORY = 10;

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  autoFocus = false,
  showHistory = true,
  showClear = true,
  onKeyDown,
  className,
}: SearchInputProps) {
  const { theme } = useAppStore();
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    if (showHistory) {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        try {
          setHistory(JSON.parse(stored));
        } catch {
          setHistory([]);
        }
      }
    }
  }, [showHistory]);

  // Save to history
  const addToHistory = useCallback((term: string) => {
    if (!term.trim() || !showHistory) return;

    const newHistory = [
      term,
      ...history.filter(h => h !== term),
    ].slice(0, MAX_HISTORY);

    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, [history, showHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const removeFromHistory = useCallback((term: string) => {
    const newHistory = history.filter(h => h !== term);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      addToHistory(value.trim());
      onSearch?.(value);
    }
    if (e.key === 'Escape') {
      onChange('');
      inputRef.current?.blur();
    }
    onKeyDown?.(e);
  };

  const handleSelectHistory = (term: string) => {
    onChange(term);
    addToHistory(term);
    onSearch?.(term);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const showDropdown = isFocused && !value && history.length > 0;

  return (
    <div className={clsx('relative', className)}>
      {/* Input */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
        isFocused
          ? theme === 'dark'
            ? 'bg-omnifocus-bg border-omnifocus-purple'
            : 'bg-white border-omnifocus-purple shadow-sm'
          : theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-gray-100 border-transparent'
      )}>
        <Search
          size={18}
          className={clsx(
            'shrink-0 transition-colors',
            isFocused
              ? 'text-omnifocus-purple'
              : theme === 'dark'
                ? 'text-gray-500'
                : 'text-gray-400'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={clsx(
            'flex-1 bg-transparent outline-none text-sm',
            theme === 'dark'
              ? 'text-white placeholder-gray-500'
              : 'text-gray-900 placeholder-gray-400'
          )}
        />
        {showClear && value && (
          <button
            onClick={handleClear}
            className={clsx(
              'p-0.5 rounded transition-colors',
              theme === 'dark'
                ? 'text-gray-500 hover:text-white'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* History dropdown */}
      {showDropdown && (
        <div className={clsx(
          'absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className={clsx(
                'text-xs font-medium',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Recent searches
              </span>
              <button
                onClick={clearHistory}
                className={clsx(
                  'text-xs transition-colors',
                  theme === 'dark'
                    ? 'text-gray-500 hover:text-red-400'
                    : 'text-gray-400 hover:text-red-500'
                )}
              >
                Clear all
              </button>
            </div>
            {history.map((term, i) => (
              <div
                key={i}
                className={clsx(
                  'group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                  theme === 'dark'
                    ? 'hover:bg-omnifocus-surface'
                    : 'hover:bg-gray-100'
                )}
                onClick={() => handleSelectHistory(term)}
              >
                <Clock size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
                <span className={clsx(
                  'flex-1 text-sm truncate',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {term}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(term);
                  }}
                  className={clsx(
                    'p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                    theme === 'dark'
                      ? 'text-gray-500 hover:text-red-400'
                      : 'text-gray-400 hover:text-red-500'
                  )}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline search
interface InlineSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InlineSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: InlineSearchProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-center gap-2 px-2 py-1 rounded-lg',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <Search size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'flex-1 bg-transparent outline-none text-sm',
          theme === 'dark'
            ? 'text-white placeholder-gray-500'
            : 'text-gray-900 placeholder-gray-400'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// Search with filters dropdown
interface FilteredSearchProps {
  value: string;
  onChange: (value: string) => void;
  filters: {
    label: string;
    value: string;
    active: boolean;
    onToggle: () => void;
  }[];
  placeholder?: string;
  className?: string;
}

export function FilteredSearch({
  value,
  onChange,
  filters,
  placeholder = 'Search...',
  className,
}: FilteredSearchProps) {
  const { theme } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);
  const activeFilters = filters.filter(f => f.active);

  return (
    <div className={clsx('relative', className)}>
      <div className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-xl border',
        theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-border'
          : 'bg-gray-100 border-transparent'
      )}>
        <Search size={18} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'flex-1 bg-transparent outline-none text-sm',
            theme === 'dark'
              ? 'text-white placeholder-gray-500'
              : 'text-gray-900 placeholder-gray-400'
          )}
        />

        {/* Active filters badges */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-1">
            {activeFilters.map(filter => (
              <span
                key={filter.value}
                className={clsx(
                  'px-2 py-0.5 rounded-full text-xs',
                  theme === 'dark'
                    ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                    : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                )}
              >
                {filter.label}
              </span>
            ))}
          </div>
        )}

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'p-1 rounded transition-colors',
            showFilters || activeFilters.length > 0
              ? 'text-omnifocus-purple'
              : theme === 'dark'
                ? 'text-gray-500 hover:text-white'
                : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <ArrowRight size={16} className={clsx(showFilters && 'rotate-90', 'transition-transform')} />
        </button>
      </div>

      {/* Filters dropdown */}
      {showFilters && (
        <div className={clsx(
          'absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl border overflow-hidden z-50',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="p-2">
            {filters.map(filter => (
              <button
                key={filter.value}
                onClick={filter.onToggle}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  filter.active
                    ? theme === 'dark'
                      ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center',
                  filter.active
                    ? 'bg-omnifocus-purple border-omnifocus-purple'
                    : theme === 'dark'
                      ? 'border-gray-600'
                      : 'border-gray-300'
                )}>
                  {filter.active && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for debounced search
export function useDebounceSearch(delay: number = 300) {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return {
    value,
    debouncedValue,
    setValue,
    clear: () => {
      setValue('');
      setDebouncedValue('');
    },
  };
}
