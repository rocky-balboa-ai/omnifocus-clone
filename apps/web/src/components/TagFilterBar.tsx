'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Tags, X, Check, ChevronDown, Search } from 'lucide-react';
import { getTagColor } from './TagColorPicker';
import clsx from 'clsx';

interface TagFilterBarProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagFilterBar({ selectedTagIds, onTagsChange, className }: TagFilterBarProps) {
  const { tags, theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const lowerSearch = search.toLowerCase();
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(lowerSearch)
    );
  }, [tags, search]);

  const selectedTags = useMemo(() => {
    return tags.filter(tag => selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)}>
      {/* Tag dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
            selectedTagIds.length > 0
              ? 'bg-green-500/20 text-green-500'
              : theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900'
          )}
        >
          <Tags size={14} />
          <span>Tags</span>
          {selectedTagIds.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-500 text-white text-xs">
              {selectedTagIds.length}
            </span>
          )}
          <ChevronDown size={14} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className={clsx(
              'absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl border overflow-hidden z-50',
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
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tags..."
                    className={clsx(
                      'flex-1 bg-transparent outline-none text-sm',
                      theme === 'dark'
                        ? 'text-white placeholder-gray-500'
                        : 'text-gray-900 placeholder-gray-400'
                    )}
                  />
                </div>
              </div>

              {/* Tags list */}
              <div className="p-2 max-h-48 overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <p className={clsx(
                    'text-sm text-center py-2',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    No tags found
                  </p>
                ) : (
                  filteredTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    const tagColor = getTagColor(tag.id);

                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={clsx(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                          isSelected
                            ? theme === 'dark'
                              ? 'bg-green-500/20'
                              : 'bg-green-100'
                            : theme === 'dark'
                              ? 'hover:bg-omnifocus-surface'
                              : 'hover:bg-gray-100'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-3 h-3 rounded-full shrink-0',
                            tagColor ? tagColor.bg : ''
                          )}
                          style={!tagColor ? {
                            backgroundColor: `hsl(${(tag.name.charCodeAt(0) * 47) % 360}, 70%, 60%)`
                          } : undefined}
                        />
                        <span className={clsx(
                          'flex-1 truncate',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {tag.name}
                        </span>
                        {isSelected && (
                          <Check size={14} className="text-green-500 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              {selectedTagIds.length > 0 && (
                <div className={clsx(
                  'p-2 border-t',
                  theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
                )}>
                  <button
                    onClick={clearAll}
                    className={clsx(
                      'w-full px-3 py-1.5 rounded text-sm text-left transition-colors',
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Selected tags pills */}
      {selectedTags.map(tag => {
        const tagColor = getTagColor(tag.id);

        return (
          <span
            key={tag.id}
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              tagColor
                ? `${tagColor.bg}/20 ${tagColor.text}`
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-300'
                  : 'bg-gray-100 text-gray-700'
            )}
          >
            {tagColor && (
              <span className={clsx('w-2 h-2 rounded-full', tagColor.bg)} />
            )}
            {tag.name}
            <button
              onClick={() => toggleTag(tag.id)}
              className="ml-0.5 hover:opacity-70"
            >
              <X size={12} />
            </button>
          </span>
        );
      })}
    </div>
  );
}
