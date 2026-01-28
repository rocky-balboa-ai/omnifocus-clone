'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { X, Tag, Plus, Check } from 'lucide-react';
import clsx from 'clsx';

interface TagInputProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
}

export function TagInput({
  selectedTagIds,
  onChange,
  placeholder = 'Add tags...',
  maxTags,
  allowCreate = false,
  className,
}: TagInputProps) {
  const { theme, tags } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get selected tags
  const selectedTags = useMemo(() => {
    return tags.filter(t => selectedTagIds.includes(t.id));
  }, [tags, selectedTagIds]);

  // Filter available tags
  const filteredTags = useMemo(() => {
    const search = inputValue.toLowerCase().trim();
    return tags
      .filter(t => !selectedTagIds.includes(t.id))
      .filter(t => !search || t.name.toLowerCase().includes(search))
      .slice(0, 10);
  }, [tags, selectedTagIds, inputValue]);

  // Check if we can create a new tag
  const canCreateTag = useMemo(() => {
    if (!allowCreate || !inputValue.trim()) return false;
    const search = inputValue.toLowerCase().trim();
    return !tags.some(t => t.name.toLowerCase() === search);
  }, [allowCreate, inputValue, tags]);

  // Handle tag removal
  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  // Handle tag selection
  const handleSelectTag = (tagId: string) => {
    if (maxTags && selectedTagIds.length >= maxTags) return;
    onChange([...selectedTagIds, tagId]);
    setInputValue('');
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Handle tag creation
  const handleCreateTag = () => {
    if (!canCreateTag) return;
    // In a real app, this would create the tag via API
    // For now, we just clear the input
    setInputValue('');
    setHighlightedIndex(0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalOptions = filteredTags.length + (canCreateTag ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (canCreateTag && highlightedIndex === filteredTags.length) {
          handleCreateTag();
        } else if (filteredTags[highlightedIndex]) {
          handleSelectTag(filteredTags[highlightedIndex].id);
        }
        break;
      case 'Backspace':
        if (!inputValue && selectedTagIds.length > 0) {
          handleRemoveTag(selectedTagIds[selectedTagIds.length - 1]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredTags.length]);

  const showDropdown = isOpen && (filteredTags.length > 0 || canCreateTag);

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Input container */}
      <div
        className={clsx(
          'flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg border min-h-[42px] cursor-text',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border focus-within:border-omnifocus-purple'
            : 'bg-white border-gray-200 focus-within:border-omnifocus-purple',
          'transition-colors'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tags */}
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              'bg-omnifocus-purple/20 text-omnifocus-purple'
            )}
          >
            <Tag size={10} />
            {tag.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="hover:bg-omnifocus-purple/30 rounded-full p-0.5 -mr-0.5"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Input */}
        {(!maxTags || selectedTagIds.length < maxTags) && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className={clsx(
              'flex-1 min-w-24 bg-transparent text-sm outline-none',
              theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            )}
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className={clsx(
          'absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="max-h-48 overflow-y-auto">
            {filteredTags.map((tag, index) => (
              <button
                key={tag.id}
                onClick={() => handleSelectTag(tag.id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  index === highlightedIndex
                    ? theme === 'dark'
                      ? 'bg-omnifocus-surface'
                      : 'bg-gray-100'
                    : theme === 'dark'
                      ? 'hover:bg-omnifocus-surface'
                      : 'hover:bg-gray-50'
                )}
              >
                <Tag size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {tag.name}
                </span>
                {tag._count && (
                  <span className={clsx(
                    'ml-auto text-xs',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {tag._count.actions}
                  </span>
                )}
              </button>
            ))}

            {/* Create new tag option */}
            {canCreateTag && (
              <button
                onClick={handleCreateTag}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors border-t',
                  highlightedIndex === filteredTags.length
                    ? theme === 'dark'
                      ? 'bg-omnifocus-surface'
                      : 'bg-gray-100'
                    : theme === 'dark'
                      ? 'hover:bg-omnifocus-surface'
                      : 'hover:bg-gray-50',
                  theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-100'
                )}
              >
                <Plus size={14} className="text-omnifocus-purple" />
                <span className="text-omnifocus-purple">
                  Create "{inputValue.trim()}"
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Max tags message */}
      {maxTags && selectedTagIds.length >= maxTags && (
        <p className={clsx(
          'text-xs mt-1',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}

// Compact tag display
interface TagDisplayProps {
  tagIds: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagDisplay({ tagIds, maxVisible = 3, size = 'sm', className }: TagDisplayProps) {
  const { theme, tags } = useAppStore();

  const selectedTags = tags.filter(t => tagIds.includes(t.id));
  const visibleTags = selectedTags.slice(0, maxVisible);
  const hiddenCount = selectedTags.length - maxVisible;

  if (selectedTags.length === 0) return null;

  return (
    <div className={clsx('flex items-center gap-1 flex-wrap', className)}>
      {visibleTags.map(tag => (
        <span
          key={tag.id}
          className={clsx(
            'inline-flex items-center gap-0.5 rounded-full font-medium',
            size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-300'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          <Tag size={size === 'sm' ? 8 : 10} />
          {tag.name}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

// Tag selector (checklist style)
interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagSelector({ selectedTagIds, onChange, className }: TagSelectorProps) {
  const { theme, tags } = useAppStore();
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const searchLower = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(searchLower));
  }, [tags, search]);

  const handleToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  return (
    <div className={className}>
      {/* Search */}
      <div className="relative mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className={clsx(
            'w-full px-3 py-2 rounded-lg text-sm outline-none',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-white placeholder-gray-500'
              : 'bg-gray-100 text-gray-900 placeholder-gray-400'
          )}
        />
      </div>

      {/* Tag list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {filteredTags.length === 0 ? (
          <p className={clsx(
            'text-sm text-center py-4',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            No tags found
          </p>
        ) : (
          filteredTags.map(tag => {
            const isSelected = selectedTagIds.includes(tag.id);

            return (
              <button
                key={tag.id}
                onClick={() => handleToggle(tag.id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors',
                  theme === 'dark'
                    ? 'hover:bg-omnifocus-surface'
                    : 'hover:bg-gray-100'
                )}
              >
                <div className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-omnifocus-purple border-omnifocus-purple'
                    : theme === 'dark'
                      ? 'border-gray-600'
                      : 'border-gray-300'
                )}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
                <Tag size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                <span className={clsx(
                  'flex-1 text-sm',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {tag.name}
                </span>
                {tag._count && (
                  <span className={clsx(
                    'text-xs',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {tag._count.actions}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
