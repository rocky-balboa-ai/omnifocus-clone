'use client';

import { useEffect, useState } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { Undo2, X, Check, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface UndoItem {
  id: string;
  actionId: string;
  title: string;
  timestamp: number;
  type: 'completed' | 'deleted';
  actionData?: Partial<Action>;
}

export function UndoToast() {
  const { theme, uncompleteAction, createAction } = useAppStore();
  const [undoItems, setUndoItems] = useState<UndoItem[]>([]);

  // Listen for completed actions
  useEffect(() => {
    const handleCompleted = (event: CustomEvent<{ actionId: string; title: string }>) => {
      const newItem: UndoItem = {
        id: Math.random().toString(36).substr(2, 9),
        actionId: event.detail.actionId,
        title: event.detail.title,
        timestamp: Date.now(),
        type: 'completed',
      };
      setUndoItems(prev => [...prev, newItem]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setUndoItems(prev => prev.filter(item => item.id !== newItem.id));
      }, 5000);
    };

    window.addEventListener('action-completed' as any, handleCompleted);
    return () => window.removeEventListener('action-completed' as any, handleCompleted);
  }, []);

  // Listen for deleted actions
  useEffect(() => {
    const handleDeleted = (event: CustomEvent<{ actionId: string; title: string; actionData: Partial<Action> }>) => {
      const newItem: UndoItem = {
        id: Math.random().toString(36).substr(2, 9),
        actionId: event.detail.actionId,
        title: event.detail.title,
        timestamp: Date.now(),
        type: 'deleted',
        actionData: event.detail.actionData,
      };
      setUndoItems(prev => [...prev, newItem]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setUndoItems(prev => prev.filter(item => item.id !== newItem.id));
      }, 5000);
    };

    window.addEventListener('action-deleted' as any, handleDeleted);
    return () => window.removeEventListener('action-deleted' as any, handleDeleted);
  }, []);

  const handleUndo = async (item: UndoItem) => {
    try {
      if (item.type === 'completed') {
        await uncompleteAction(item.actionId);
      } else if (item.type === 'deleted' && item.actionData) {
        // Recreate the action (without the id, timestamps, etc.)
        const { id, completedAt, project, tags, children, attachments, status, ...restoreData } = item.actionData as any;
        await createAction({
          ...restoreData,
        });
      }
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
          <div className={clsx(
            'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
            item.type === 'completed' ? 'bg-green-500/20' : 'bg-red-500/20'
          )}>
            {item.type === 'completed' ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Trash2 size={14} className="text-red-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={clsx('text-sm truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              {item.type === 'completed' ? 'Completed' : 'Deleted'}: {item.title}
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
