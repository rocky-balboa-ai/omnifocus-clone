'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Plus, Send, X } from 'lucide-react';
import { parseQuickAdd } from '@/lib/parseQuickAdd';
import clsx from 'clsx';

interface InlineQuickAddProps {
  projectId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InlineQuickAdd({
  projectId,
  placeholder = "Add a task... (try: 'Call mom tomorrow #personal')",
  autoFocus = false,
}: InlineQuickAddProps) {
  const { theme, createAction, fetchActions, currentPerspective } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(autoFocus);
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Parse natural language
      const parsed = parseQuickAdd(value);

      await createAction({
        title: parsed.title,
        dueDate: parsed.dueDate,
        deferDate: parsed.deferDate,
        flagged: parsed.flagged,
        estimatedMinutes: parsed.estimatedMinutes,
        projectId: projectId,
      });

      setValue('');
      fetchActions(currentPerspective);

      // Keep focus for rapid entry
      inputRef.current?.focus();
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
      setValue('');
      setIsExpanded(false);
    }
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-colors text-sm',
          theme === 'dark'
            ? 'border-omnifocus-border text-gray-500 hover:border-omnifocus-purple hover:text-omnifocus-purple'
            : 'border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-500'
        )}
      >
        <Plus size={16} />
        <span>Add task...</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={clsx(
      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-purple'
        : 'bg-white border-purple-300 shadow-sm'
    )}>
      <Plus size={16} className="text-omnifocus-purple shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={isSubmitting}
        className={clsx(
          'flex-1 bg-transparent outline-none text-sm',
          theme === 'dark'
            ? 'text-white placeholder-gray-500'
            : 'text-gray-900 placeholder-gray-400'
        )}
      />
      {value.trim() && (
        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            'p-1 rounded transition-colors shrink-0',
            isSubmitting
              ? 'text-gray-500'
              : 'text-omnifocus-purple hover:bg-omnifocus-purple/10'
          )}
        >
          <Send size={16} />
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setValue('');
          setIsExpanded(false);
        }}
        className={clsx(
          'p-1 rounded transition-colors shrink-0',
          theme === 'dark'
            ? 'text-gray-500 hover:text-gray-300'
            : 'text-gray-400 hover:text-gray-600'
        )}
      >
        <X size={16} />
      </button>
    </form>
  );
}
