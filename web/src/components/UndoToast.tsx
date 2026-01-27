'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Undo2, X } from 'lucide-react';
import clsx from 'clsx';

interface UndoItem {
  id: string;
  actionId: string;
  title: string;
  timestamp: number;
}

export function UndoToast() {
  const { theme } = useAppStore();
  const [undoItems, setUndoItems] = useState<UndoItem[]>([]);

  // Listen for custom undo events
  useEffect(() => {
    const handleUndoEvent = (event: CustomEvent<{ actionId: string; title: string }>) => {
      const newItem: UndoItem = {
        id: Math.random().toString(36).substr(2, 9),
        actionId: event.detail.actionId,
        title: event.detail.title,
        timestamp: Date.now(),
      };
      setUndoItems(prev => [...prev, newItem]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setUndoItems(prev => prev.filter(item => item.id !== newItem.id));
      }, 5000);
    };

    window.addEventListener('action-completed' as any, handleUndoEvent);
    return () => window.removeEventListener('action-completed' as any, handleUndoEvent);
  }, []);

  const { uncompleteAction, fetchActions, currentPerspective } = useAppStore();

  const handleUndo = async (item: UndoItem) => {
    try {
      await uncompleteAction(item.actionId);
    } catch (error) {
      console.error('Failed to undo:', error);
    }

    // Remove from list
    setUndoItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleDismiss = (id: string) => {
    setUndoItems(prev => prev.filter(item => item.id !== id));
  };

  if (undoItems.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 space-y-2">
      {undoItems.map(item => (
        <div
          key={item.id}
          className={clsx(
            'flex items-center gap-3 p-3 rounded-lg shadow-lg border animate-slide-up',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}
        >
          <div className="flex-1 min-w-0">
            <p className={clsx('text-sm truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Completed: {item.title}
            </p>
          </div>
          <button
            onClick={() => handleUndo(item)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 transition-colors"
          >
            <Undo2 size={14} />
            <span>Undo</span>
          </button>
          <button
            onClick={() => handleDismiss(item.id)}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
