'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Keyboard,
  X,
  Command,
} from 'lucide-react';
import clsx from 'clsx';

interface ShortcutCategory {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['I'], description: 'Go to Inbox' },
      { keys: ['P'], description: 'Go to Projects' },
      { keys: ['T'], description: 'Go to Tags' },
      { keys: ['F'], description: 'Go to Flagged' },
      { keys: ['D'], description: 'Go to Forecast' },
      { keys: ['R'], description: 'Go to Review' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'New task' },
      { keys: ['⌘', 'P'], description: 'Command palette' },
      { keys: ['⌘', 'K'], description: 'Quick search' },
      { keys: ['B'], description: 'Time blocker' },
      { keys: ['Enter'], description: 'Edit selected task' },
      { keys: ['E'], description: 'Toggle complete' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate tasks' },
      { keys: ['⌘', 'A'], description: 'Select all' },
      { keys: ['Escape'], description: 'Deselect / Close' },
      { keys: ['Space'], description: 'Toggle selection' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['⌘', '\\'], description: 'Toggle sidebar' },
      { keys: ['⌘', 'J'], description: 'Toggle theme' },
      { keys: ['?'], description: 'Show shortcuts' },
    ],
  },
];

interface KeyboardShortcutHintsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutHints({ isOpen, onClose }: KeyboardShortcutHintsProps) {
  const { theme } = useAppStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx(
        'relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border overflow-hidden',
        'animate-in fade-in zoom-in-95 duration-200',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <Keyboard className="text-omnifocus-purple" size={24} />
            <h2 className={clsx(
              'text-lg font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUTS.map((category, i) => (
              <div key={i}>
                <h3 className={clsx(
                  'text-sm font-semibold mb-3',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between"
                    >
                      <span className={clsx(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {shortcut.description}
                      </span>
                      <KeyCombo keys={shortcut.keys} theme={theme} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={clsx(
          'px-6 py-3 border-t text-center',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            Press <KeyCombo keys={['?']} theme={theme} inline /> to toggle this dialog
          </p>
        </div>
      </div>
    </div>
  );
}

// Key combination display
interface KeyComboProps {
  keys: string[];
  theme: 'light' | 'dark';
  inline?: boolean;
}

export function KeyCombo({ keys, theme, inline = false }: KeyComboProps) {
  return (
    <div className={clsx(
      'flex items-center gap-1',
      inline && 'inline-flex'
    )}>
      {keys.map((key, i) => (
        <span key={i}>
          {i > 0 && (
            <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}>
              +
            </span>
          )}
          <kbd className={clsx(
            'px-2 py-0.5 rounded text-xs font-medium',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-300 border border-omnifocus-border'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          )}>
            {key === '⌘' ? (
              <Command size={12} className="inline" />
            ) : key}
          </kbd>
        </span>
      ))}
    </div>
  );
}

// Small inline shortcut hint
interface ShortcutHintProps {
  keys: string[];
  className?: string;
}

export function ShortcutHint({ keys, className }: ShortcutHintProps) {
  const { theme } = useAppStore();

  return (
    <span className={clsx(
      'inline-flex items-center gap-0.5',
      className
    )}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className={clsx(
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            theme === 'dark'
              ? 'bg-omnifocus-bg text-gray-500 border border-omnifocus-border'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          )}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

// Hook to show keyboard shortcuts modal
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        // Don't trigger in input fields
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

// Floating shortcut hint that appears on hover
interface FloatingShortcutProps {
  keys: string[];
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function FloatingShortcut({
  keys,
  children,
  position = 'bottom',
  className,
}: FloatingShortcutProps) {
  const { theme } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  };

  return (
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={clsx(
          'absolute z-50 pointer-events-none',
          'animate-in fade-in duration-150',
          positionClasses[position]
        )}>
          <div className={clsx(
            'px-2 py-1 rounded-lg shadow-lg border',
            theme === 'dark'
              ? 'bg-omnifocus-sidebar border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <KeyCombo keys={keys} theme={theme} />
          </div>
        </div>
      )}
    </div>
  );
}
