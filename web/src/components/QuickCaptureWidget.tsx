'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Plus, CornerDownLeft, X } from 'lucide-react';
import clsx from 'clsx';

interface QuickCaptureWidgetProps {
  className?: string;
}

export function QuickCaptureWidget({ className }: QuickCaptureWidgetProps) {
  const { theme, createAction, currentPerspective } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createAction({
        title: title.trim(),
        status: 'active',
        flagged: false,
        position: 0,
      });
      setTitle('');
      // Keep expanded for quick successive entries
    } catch (error) {
      console.error('Failed to create action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-all',
          theme === 'dark'
            ? 'border-omnifocus-border text-gray-500 hover:border-omnifocus-purple hover:text-omnifocus-purple'
            : 'border-gray-200 text-gray-400 hover:border-omnifocus-purple hover:text-omnifocus-purple',
          className
        )}
      >
        <Plus size={16} />
        <span className="text-sm">Quick capture...</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        'rounded-lg border transition-all',
        theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-purple'
          : 'bg-white border-omnifocus-purple shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <Plus size={16} className="text-omnifocus-purple shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className={clsx(
            'flex-1 bg-transparent outline-none text-sm',
            theme === 'dark'
              ? 'text-white placeholder-gray-500'
              : 'text-gray-900 placeholder-gray-400'
          )}
        />
        {title.trim() && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="p-1 rounded bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CornerDownLeft size={14} />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setTitle('');
          }}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <X size={14} />
        </button>
      </div>
      <div className={clsx(
        'px-3 pb-2 text-xs',
        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
      )}>
        Press <kbd className={clsx(
          'px-1 py-0.5 rounded text-[10px]',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
        )}>Enter</kbd> to add, <kbd className={clsx(
          'px-1 py-0.5 rounded text-[10px]',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
        )}>Esc</kbd> to cancel
      </div>
    </form>
  );
}
