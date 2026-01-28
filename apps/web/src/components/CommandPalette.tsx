'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Search,
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  Sun,
  BarChart3,
  RefreshCw,
  Plus,
  Settings,
  Keyboard,
  Clock,
  Target,
  Moon,
  SunMedium,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  iconColor?: string;
  category: 'navigation' | 'action' | 'settings';
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const {
    theme,
    setCurrentPerspective,
    setQuickEntryOpen,
    setSettingsOpen,
    setKeyboardHelpOpen,
    setFocusTimerOpen,
    setWeeklyReviewOpen,
    setHabitTrackerOpen,
    setTimeBlockerOpen,
    setTheme,
    toggleFocusMode,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define all commands
  const commands: Command[] = useMemo(() => [
    // Navigation
    { id: 'nav-inbox', label: 'Go to Inbox', icon: Inbox, iconColor: 'text-blue-500', category: 'navigation', keywords: ['inbox', 'tasks'], action: () => { setCurrentPerspective('inbox'); onClose(); } },
    { id: 'nav-projects', label: 'Go to Projects', icon: FolderKanban, iconColor: 'text-purple-500', category: 'navigation', keywords: ['projects', 'folders'], action: () => { setCurrentPerspective('projects'); onClose(); } },
    { id: 'nav-tags', label: 'Go to Tags', icon: Tags, iconColor: 'text-green-500', category: 'navigation', keywords: ['tags', 'labels'], action: () => { setCurrentPerspective('tags'); onClose(); } },
    { id: 'nav-forecast', label: 'Go to Forecast', icon: Calendar, iconColor: 'text-orange-500', category: 'navigation', keywords: ['forecast', 'calendar', 'schedule'], action: () => { setCurrentPerspective('forecast'); onClose(); } },
    { id: 'nav-flagged', label: 'Go to Flagged', icon: Flag, iconColor: 'text-omnifocus-orange', category: 'navigation', keywords: ['flagged', 'important', 'starred'], action: () => { setCurrentPerspective('flagged'); onClose(); } },
    { id: 'nav-today', label: 'Go to Today', icon: Sun, iconColor: 'text-yellow-500', category: 'navigation', keywords: ['today', 'daily'], action: () => { setCurrentPerspective('today'); onClose(); } },
    { id: 'nav-review', label: 'Go to Review', icon: RefreshCw, iconColor: 'text-teal-500', category: 'navigation', keywords: ['review', 'gtd'], action: () => { setCurrentPerspective('review'); onClose(); } },
    { id: 'nav-stats', label: 'Go to Statistics', icon: BarChart3, iconColor: 'text-indigo-500', category: 'navigation', keywords: ['stats', 'statistics', 'analytics'], action: () => { setCurrentPerspective('stats'); onClose(); } },

    // Actions
    { id: 'action-new', label: 'New Task', description: 'Create a new action', icon: Plus, iconColor: 'text-omnifocus-purple', category: 'action', keywords: ['new', 'add', 'create', 'task'], action: () => { setQuickEntryOpen(true); onClose(); } },
    { id: 'action-focus', label: 'Start Focus Mode', description: 'Enter distraction-free mode', icon: Zap, iconColor: 'text-yellow-500', category: 'action', keywords: ['focus', 'concentrate', 'zen'], action: () => { toggleFocusMode(); onClose(); } },
    { id: 'action-timer', label: 'Open Focus Timer', description: 'Start a pomodoro session', icon: Clock, iconColor: 'text-red-500', category: 'action', keywords: ['timer', 'pomodoro', 'focus'], action: () => { setFocusTimerOpen(true); onClose(); } },
    { id: 'action-review', label: 'Start Weekly Review', description: 'Review your GTD system', icon: RefreshCw, iconColor: 'text-teal-500', category: 'action', keywords: ['review', 'weekly', 'gtd'], action: () => { setWeeklyReviewOpen(true); onClose(); } },
    { id: 'action-habits', label: 'Open Habit Tracker', description: 'Track your daily habits', icon: Target, iconColor: 'text-green-500', category: 'action', keywords: ['habits', 'tracker', 'routine'], action: () => { setHabitTrackerOpen(true); onClose(); } },
    { id: 'action-blocks', label: 'Open Time Blocks', description: 'Schedule time blocks', icon: Calendar, iconColor: 'text-purple-500', category: 'action', keywords: ['blocks', 'time', 'schedule'], action: () => { setTimeBlockerOpen(true); onClose(); } },

    // Settings
    { id: 'settings-open', label: 'Open Settings', icon: Settings, iconColor: 'text-gray-500', category: 'settings', keywords: ['settings', 'preferences', 'options'], action: () => { setSettingsOpen(true); onClose(); } },
    { id: 'settings-shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, iconColor: 'text-gray-500', category: 'settings', keywords: ['keyboard', 'shortcuts', 'keys', 'hotkeys'], action: () => { setKeyboardHelpOpen(true); onClose(); } },
    { id: 'settings-dark', label: 'Switch to Dark Mode', icon: Moon, iconColor: 'text-indigo-400', category: 'settings', keywords: ['dark', 'theme', 'mode'], action: () => { setTheme('dark'); onClose(); } },
    { id: 'settings-light', label: 'Switch to Light Mode', icon: SunMedium, iconColor: 'text-yellow-500', category: 'settings', keywords: ['light', 'theme', 'mode'], action: () => { setTheme('light'); onClose(); } },
  ], [setCurrentPerspective, setQuickEntryOpen, setSettingsOpen, setKeyboardHelpOpen, setFocusTimerOpen, setWeeklyReviewOpen, setHabitTrackerOpen, setTimeBlockerOpen, setTheme, toggleFocusMode, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const searchText = [cmd.label, cmd.description, ...(cmd.keywords || [])].join(' ').toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      action: [],
      settings: [],
    };

    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className={clsx(
        'relative w-full max-w-xl rounded-xl shadow-2xl overflow-hidden',
        'animate-in fade-in slide-in-from-top-4 duration-200',
        theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
      )}>
        {/* Search Input */}
        <div className={clsx(
          'flex items-center gap-3 px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <Search size={20} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={clsx(
              'flex-1 bg-transparent outline-none text-base',
              theme === 'dark'
                ? 'text-white placeholder-gray-500'
                : 'text-gray-900 placeholder-gray-400'
            )}
          />
          <kbd className={clsx(
            'px-2 py-0.5 rounded text-xs',
            theme === 'dark'
              ? 'bg-omnifocus-bg text-gray-500'
              : 'bg-gray-100 text-gray-400'
          )}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className={clsx(
              'text-center py-8',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              No commands found
            </div>
          ) : (
            <>
              {/* Navigation */}
              {groupedCommands.navigation.length > 0 && (
                <div className="mb-2">
                  <p className={clsx(
                    'px-3 py-1 text-xs font-medium',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    Navigation
                  </p>
                  {groupedCommands.navigation.map(cmd => {
                    const index = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-index={index}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                          selectedIndex === index
                            ? theme === 'dark'
                              ? 'bg-omnifocus-surface'
                              : 'bg-gray-100'
                            : 'hover:bg-opacity-50'
                        )}
                      >
                        <Icon size={18} className={cmd.iconColor} />
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                          {cmd.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              {groupedCommands.action.length > 0 && (
                <div className="mb-2">
                  <p className={clsx(
                    'px-3 py-1 text-xs font-medium',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    Actions
                  </p>
                  {groupedCommands.action.map(cmd => {
                    const index = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-index={index}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                          selectedIndex === index
                            ? theme === 'dark'
                              ? 'bg-omnifocus-surface'
                              : 'bg-gray-100'
                            : 'hover:bg-opacity-50'
                        )}
                      >
                        <Icon size={18} className={cmd.iconColor} />
                        <div className="flex-1">
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                            {cmd.label}
                          </span>
                          {cmd.description && (
                            <span className={clsx(
                              'ml-2 text-sm',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )}>
                              {cmd.description}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Settings */}
              {groupedCommands.settings.length > 0 && (
                <div>
                  <p className={clsx(
                    'px-3 py-1 text-xs font-medium',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    Settings
                  </p>
                  {groupedCommands.settings.map(cmd => {
                    const index = flatIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        data-index={index}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                          selectedIndex === index
                            ? theme === 'dark'
                              ? 'bg-omnifocus-surface'
                              : 'bg-gray-100'
                            : 'hover:bg-opacity-50'
                        )}
                      >
                        <Icon size={18} className={cmd.iconColor} />
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                          {cmd.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-2 border-t text-xs',
          theme === 'dark'
            ? 'border-omnifocus-border text-gray-500'
            : 'border-gray-200 text-gray-400'
        )}>
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-gray-500/20">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-gray-500/20">↵</kbd> Select</span>
          </div>
          <span>⌘P to open</span>
        </div>
      </div>
    </div>
  );
}
