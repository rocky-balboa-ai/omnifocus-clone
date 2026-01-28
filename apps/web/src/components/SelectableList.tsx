'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Check, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SelectableItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string;
}

interface SelectableListProps {
  items: SelectableItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxHeight?: number;
  showSelectAll?: boolean;
  className?: string;
}

export function SelectableList({
  items,
  selectedIds,
  onChange,
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found',
  maxHeight = 300,
  showSelectAll = false,
  className,
}: SelectableListProps) {
  const { theme } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Group items
  const groupedItems = useMemo(() => {
    const groups = new Map<string, SelectableItem[]>();
    filteredItems.forEach(item => {
      const group = item.group || '';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item);
    });
    return groups;
  }, [filteredItems]);

  // Check if all items are selected
  const allSelected = filteredItems.every(item =>
    item.disabled || selectedIds.includes(item.id)
  );

  const handleSelect = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.disabled) return;

    if (multiple) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter(sid => sid !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    } else {
      onChange([id]);
    }
  }, [items, selectedIds, multiple, onChange]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onChange(selectedIds.filter(id => !filteredItems.some(item => item.id === id)));
    } else {
      // Select all non-disabled
      const newIds = new Set(selectedIds);
      filteredItems.forEach(item => {
        if (!item.disabled) {
          newIds.add(item.id);
        }
      });
      onChange(Array.from(newIds));
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const enabledItems = filteredItems.filter(i => !i.disabled);
    if (enabledItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % enabledItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + enabledItems.length) % enabledItems.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < enabledItems.length) {
          handleSelect(enabledItems[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setSearchQuery('');
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  let flatIndex = 0;

  return (
    <div className={clsx('flex flex-col', className)} onKeyDown={handleKeyDown}>
      {/* Search */}
      {searchable && (
        <div className="relative mb-2">
          <Search
            size={16}
            className={clsx(
              'absolute left-3 top-1/2 -translate-y-1/2',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={clsx(
              'w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none',
              theme === 'dark'
                ? 'bg-omnifocus-surface text-white placeholder-gray-500 focus:ring-1 focus:ring-omnifocus-purple'
                : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-omnifocus-purple'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={clsx(
                'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded',
                theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
              )}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Select all */}
      {multiple && showSelectAll && filteredItems.length > 0 && (
        <button
          onClick={handleSelectAll}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-sm transition-colors',
            theme === 'dark'
              ? 'text-gray-300 hover:bg-omnifocus-surface'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <div className={clsx(
            'w-4 h-4 rounded border flex items-center justify-center',
            allSelected
              ? 'bg-omnifocus-purple border-omnifocus-purple'
              : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          )}>
            {allSelected && <Check size={10} className="text-white" />}
          </div>
          Select All
        </button>
      )}

      {/* List */}
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight }}
        role="listbox"
        aria-multiselectable={multiple}
      >
        {filteredItems.length === 0 ? (
          <p className={clsx(
            'text-sm text-center py-6',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {emptyMessage}
          </p>
        ) : (
          Array.from(groupedItems.entries()).map(([group, groupItems]) => (
            <div key={group}>
              {/* Group header */}
              {group && (
                <div className={clsx(
                  'px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {group}
                </div>
              )}

              {/* Items */}
              {groupItems.map(item => {
                const index = flatIndex++;
                const isSelected = selectedIds.includes(item.id);
                const isHighlighted = highlightedIndex === index;

                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelect(item.id)}
                    disabled={item.disabled}
                    role="option"
                    aria-selected={isSelected}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                      item.disabled && 'opacity-50 cursor-not-allowed',
                      isHighlighted && (theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'),
                      !isHighlighted && !item.disabled && (
                        theme === 'dark'
                          ? 'hover:bg-omnifocus-surface'
                          : 'hover:bg-gray-50'
                      )
                    )}
                  >
                    {/* Checkbox/Radio */}
                    <div className={clsx(
                      'w-4 h-4 flex items-center justify-center shrink-0',
                      multiple ? 'rounded border' : 'rounded-full border',
                      isSelected
                        ? 'bg-omnifocus-purple border-omnifocus-purple'
                        : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                    )}>
                      {isSelected && (
                        multiple
                          ? <Check size={10} className="text-white" />
                          : <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Icon */}
                    {item.icon && (
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                        {item.icon}
                      </span>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-sm truncate',
                        isSelected
                          ? 'font-medium'
                          : '',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {item.label}
                      </p>
                      {item.description && (
                        <p className={clsx(
                          'text-xs truncate',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Collapsible selectable list
interface CollapsibleSelectableListProps extends Omit<SelectableListProps, 'maxHeight'> {
  title: string;
  defaultExpanded?: boolean;
}

export function CollapsibleSelectableList({
  title,
  defaultExpanded = true,
  items,
  selectedIds,
  ...props
}: CollapsibleSelectableListProps) {
  const { theme } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const selectedCount = selectedIds.filter(id => items.some(item => item.id === id)).length;

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
          theme === 'dark'
            ? 'hover:bg-omnifocus-surface'
            : 'hover:bg-gray-100'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </span>
          {selectedCount > 0 && (
            <span className={clsx(
              'px-1.5 py-0.5 rounded-full text-xs font-medium',
              'bg-omnifocus-purple/20 text-omnifocus-purple'
            )}>
              {selectedCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
        ) : (
          <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
        )}
      </button>

      {isExpanded && (
        <div className="mt-1">
          <SelectableList
            items={items}
            selectedIds={selectedIds}
            {...props}
          />
        </div>
      )}
    </div>
  );
}
