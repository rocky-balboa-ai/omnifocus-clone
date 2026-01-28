'use client';

import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

export function KeyboardHintBar() {
  const { theme, selectedActionId, selectedActionIds, isFocusMode } = useAppStore();

  // Don't show in focus mode
  if (isFocusMode) return null;

  const hints = selectedActionId
    ? [
        { key: 'Space', label: 'Complete' },
        { key: 'F', label: 'Flag' },
        { key: 'D', label: 'Due today' },
        { key: 'T', label: 'Tomorrow' },
        { key: 'Del', label: 'Delete' },
        { key: 'Esc', label: 'Close' },
      ]
    : selectedActionIds.size > 0
    ? [
        { key: 'Esc', label: 'Clear selection' },
      ]
    : [
        { key: 'N', label: 'New action' },
        { key: '⌘K', label: 'Search' },
        { key: 'P', label: 'Timer' },
        { key: 'R', label: 'Review' },
        { key: '?', label: 'All shortcuts' },
      ];

  return (
    <div className={clsx(
      'hidden md:flex items-center justify-center gap-4 px-4 py-2 border-t text-xs',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar border-omnifocus-border text-gray-500'
        : 'bg-gray-50 border-gray-200 text-gray-400'
    )}>
      {hints.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <kbd className={clsx(
            'px-1.5 py-0.5 rounded font-mono text-[10px]',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400'
              : 'bg-white border border-gray-200 text-gray-500'
          )}>
            {key}
          </kbd>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
