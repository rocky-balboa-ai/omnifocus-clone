'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  GripVertical,
  Circle,
  CheckCircle2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  editable?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function Checklist({
  items,
  onChange,
  editable = true,
  showProgress = true,
  className,
}: ChecklistProps) {
  const { theme } = useAppStore();
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleToggle = (id: string) => {
    onChange(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleAdd = () => {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newItemText.trim(),
      completed: false,
    };

    onChange([...items, newItem]);
    setNewItemText('');
    inputRef.current?.focus();
  };

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = () => {
    if (!editingText.trim()) {
      handleDelete(editingId!);
    } else {
      onChange(items.map(item =>
        item.id === editingId ? { ...item, text: editingText.trim() } : item
      ));
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    onChange(newItems);
  };

  return (
    <div className={className}>
      {/* Progress bar */}
      {showProgress && items.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {completedCount} of {items.length} complete
            </span>
            <span className={clsx(
              'text-xs font-medium',
              progress === 100 ? 'text-green-500' : 'text-omnifocus-purple'
            )}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className={clsx(
            'h-1.5 rounded-full overflow-hidden',
            theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
          )}>
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                progress === 100 ? 'bg-green-500' : 'bg-omnifocus-purple'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={clsx(
              'group flex items-center gap-2 p-2 rounded-lg transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface/50' : 'hover:bg-gray-50'
            )}
          >
            {editable && (
              <div className={clsx(
                'cursor-grab opacity-0 group-hover:opacity-100 transition-opacity',
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              )}>
                <GripVertical size={14} />
              </div>
            )}

            <button
              onClick={() => handleToggle(item.id)}
              className="shrink-0"
            >
              {item.completed ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <Circle size={18} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
              )}
            </button>

            {editingId === item.id ? (
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') {
                    setEditingId(null);
                    setEditingText('');
                  }
                }}
                onBlur={handleSaveEdit}
                autoFocus
                className={clsx(
                  'flex-1 bg-transparent outline-none text-sm',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}
              />
            ) : (
              <span
                onClick={() => editable && handleStartEdit(item)}
                className={clsx(
                  'flex-1 text-sm',
                  item.completed
                    ? theme === 'dark'
                      ? 'text-gray-500 line-through'
                      : 'text-gray-400 line-through'
                    : theme === 'dark'
                      ? 'text-gray-200'
                      : 'text-gray-700',
                  editable && 'cursor-text'
                )}
              >
                {item.text}
              </span>
            )}

            {editable && (
              <button
                onClick={() => handleDelete(item.id)}
                className={clsx(
                  'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                  theme === 'dark'
                    ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                )}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new item */}
      {editable && (
        <div className={clsx(
          'flex items-center gap-2 mt-2 p-2 rounded-lg',
          theme === 'dark' ? 'bg-omnifocus-surface/30' : 'bg-gray-50'
        )}>
          <Plus size={18} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          <input
            ref={inputRef}
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Add item..."
            className={clsx(
              'flex-1 bg-transparent outline-none text-sm',
              theme === 'dark'
                ? 'text-white placeholder-gray-500'
                : 'text-gray-900 placeholder-gray-400'
            )}
          />
          {newItemText && (
            <button
              onClick={handleAdd}
              className="px-2 py-1 text-xs rounded bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90"
            >
              Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline checklist display
interface InlineChecklistProps {
  items: ChecklistItem[];
  maxItems?: number;
  className?: string;
}

export function InlineChecklist({ items, maxItems = 3, className }: InlineChecklistProps) {
  const { theme } = useAppStore();
  const completedCount = items.filter(i => i.completed).length;
  const displayItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;

  if (items.length === 0) return null;

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {displayItems.map(item => (
          item.completed ? (
            <CheckCircle2 key={item.id} size={12} className="text-green-500" />
          ) : (
            <Circle key={item.id} size={12} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          )
        ))}
        {remainingCount > 0 && (
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            +{remainingCount}
          </span>
        )}
      </div>
      <span className={clsx(
        'text-xs',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {completedCount}/{items.length}
      </span>
    </div>
  );
}

// Checklist badge showing progress
interface ChecklistBadgeProps {
  items: ChecklistItem[];
  className?: string;
}

export function ChecklistBadge({ items, className }: ChecklistBadgeProps) {
  const { theme } = useAppStore();
  const completedCount = items.filter(i => i.completed).length;
  const allComplete = completedCount === items.length;

  if (items.length === 0) return null;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
      allComplete
        ? theme === 'dark'
          ? 'bg-green-500/20 text-green-400'
          : 'bg-green-100 text-green-600'
        : theme === 'dark'
          ? 'bg-omnifocus-surface text-gray-400'
          : 'bg-gray-100 text-gray-500',
      className
    )}>
      {allComplete ? (
        <CheckCircle2 size={12} />
      ) : (
        <Circle size={12} />
      )}
      {completedCount}/{items.length}
    </span>
  );
}

// Hook for managing checklist state
export function useChecklist(initialItems: ChecklistItem[] = []) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);

  const addItem = useCallback((text: string) => {
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  }, []);

  const updateItem = useCallback((id: string, text: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems(prev => prev.filter(item => !item.completed));
  }, []);

  const reset = useCallback(() => {
    setItems(initialItems);
  }, [initialItems]);

  return {
    items,
    setItems,
    addItem,
    removeItem,
    toggleItem,
    updateItem,
    clearCompleted,
    reset,
    completedCount: items.filter(i => i.completed).length,
    totalCount: items.length,
    progress: items.length > 0 ? (items.filter(i => i.completed).length / items.length) * 100 : 0,
    isAllComplete: items.length > 0 && items.every(i => i.completed),
  };
}
