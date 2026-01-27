'use client';

import { X } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '@/stores/app.store';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { section: 'Navigation', items: [
    { keys: ['j', '↓'], description: 'Move selection down' },
    { keys: ['k', '↑'], description: 'Move selection up' },
    { keys: ['Enter', 'e'], description: 'Edit selected action' },
    { keys: ['Escape'], description: 'Close panel / deselect' },
  ]},
  { section: 'Actions', items: [
    { keys: ['n'], description: 'New action' },
    { keys: ['Space'], description: 'Complete selected action' },
    { keys: ['f'], description: 'Toggle flag' },
    { keys: ['Delete'], description: 'Delete selected action' },
  ]},
  { section: 'Due Dates', items: [
    { keys: ['d'], description: 'Due today' },
    { keys: ['t'], description: 'Due tomorrow' },
    { keys: ['w'], description: 'Due next week (Monday)' },
  ]},
  { section: 'Organization', items: [
    { keys: ['Tab'], description: 'Indent (make subtask)' },
    { keys: ['Shift', 'Tab'], description: 'Outdent (move up level)' },
  ]},
  { section: 'Tools', items: [
    { keys: ['p'], description: 'Focus Timer (Pomodoro)' },
    { keys: ['r'], description: 'Weekly Review' },
  ]},
  { section: 'Global', items: [
    { keys: ['⌘', 'K'], description: 'Search' },
    { keys: ['⌘', '\\'], description: 'Toggle focus mode' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ]},
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const { theme } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={clsx(
        'relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-slide-up',
        theme === 'dark'
          ? 'bg-omnifocus-surface border border-omnifocus-border'
          : 'bg-white border border-gray-200'
      )}>
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <h2 className={clsx(
            'text-lg font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className={clsx(
              'p-1 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-border'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {shortcuts.map((section) => (
              <div key={section.section}>
                <h3 className={clsx(
                  'text-xs font-semibold uppercase tracking-wider mb-3',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {section.section}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={clsx(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      )}>
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className={clsx(
                              'px-2 py-1 text-xs rounded font-mono',
                              theme === 'dark'
                                ? 'bg-omnifocus-bg text-gray-400 border border-omnifocus-border'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            )}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={clsx(
          'px-6 py-3 border-t text-xs text-center',
          theme === 'dark' ? 'border-omnifocus-border text-gray-500' : 'border-gray-200 text-gray-400'
        )}>
          Press <kbd className={clsx(
            'px-1.5 py-0.5 rounded font-mono mx-1',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
          )}>?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}
