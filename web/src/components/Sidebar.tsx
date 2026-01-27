'use client';

import { useAppStore } from '@/stores/app.store';
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  RefreshCw,
  Plus,
  Settings,
  Sun,
} from 'lucide-react';
import clsx from 'clsx';

const themeClasses = {
  sidebar: {
    dark: 'bg-omnifocus-sidebar border-omnifocus-border',
    light: 'bg-omnifocus-light-sidebar border-omnifocus-light-border',
  },
  title: {
    dark: 'text-white',
    light: 'text-gray-900',
  },
  navItem: {
    active: 'bg-omnifocus-purple text-white',
    inactive: {
      dark: 'text-gray-400 hover:bg-omnifocus-surface hover:text-white',
      light: 'text-gray-600 hover:bg-omnifocus-light-surface hover:text-gray-900',
    },
  },
  sectionTitle: {
    dark: 'text-gray-500',
    light: 'text-gray-400',
  },
  emptyText: {
    dark: 'text-gray-600',
    light: 'text-gray-400',
  },
  button: {
    dark: 'bg-omnifocus-surface text-gray-400 hover:text-white',
    light: 'bg-omnifocus-light-surface text-gray-600 hover:text-gray-900',
  },
};

const iconMap: Record<string, React.ReactNode> = {
  inbox: <Inbox size={18} />,
  folder: <FolderKanban size={18} />,
  tag: <Tags size={18} />,
  calendar: <Calendar size={18} />,
  flag: <Flag size={18} />,
  refresh: <RefreshCw size={18} />,
  sun: <Sun size={18} />,
};

export function Sidebar() {
  const { perspectives, currentPerspective, setCurrentPerspective, setQuickEntryOpen, openPerspectiveEditor, setSettingsOpen, theme } = useAppStore();

  const builtInPerspectives = perspectives.filter((p) => p.isBuiltIn);
  const customPerspectives = perspectives.filter((p) => !p.isBuiltIn);

  return (
    <aside className={clsx(
      'hidden md:flex w-64 border-r flex-col',
      themeClasses.sidebar[theme]
    )}>
      <div className="p-4">
        <h1 className={clsx('text-xl font-semibold', themeClasses.title[theme])}>OmniFocus</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {/* Today - special perspective */}
          <button
            onClick={() => setCurrentPerspective('today')}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              currentPerspective === 'today'
                ? themeClasses.navItem.active
                : themeClasses.navItem.inactive[theme]
            )}
          >
            <Sun size={18} />
            <span>Today</span>
          </button>

          {builtInPerspectives.map((perspective) => (
            <button
              key={perspective.id}
              onClick={() => setCurrentPerspective(perspective.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                currentPerspective === perspective.id
                  ? themeClasses.navItem.active
                  : themeClasses.navItem.inactive[theme]
              )}
            >
              {iconMap[perspective.icon || 'inbox']}
              <span>{perspective.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className={clsx(
              'text-xs font-semibold uppercase tracking-wider',
              themeClasses.sectionTitle[theme]
            )}>
              Custom
            </h3>
            <button
              onClick={() => openPerspectiveEditor()}
              className={clsx(
                'p-1 rounded transition-colors',
                themeClasses.sectionTitle[theme],
                theme === 'dark' ? 'hover:bg-omnifocus-surface hover:text-white' : 'hover:bg-omnifocus-light-surface hover:text-gray-900'
              )}
              title="New Perspective"
            >
              <Plus size={14} />
            </button>
          </div>
          {customPerspectives.length > 0 ? (
            <div className="space-y-1">
              {customPerspectives.map((perspective) => (
                <button
                  key={perspective.id}
                  onClick={() => setCurrentPerspective(perspective.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    currentPerspective === perspective.id
                      ? themeClasses.navItem.active
                      : themeClasses.navItem.inactive[theme]
                  )}
                >
                  <FolderKanban size={18} />
                  <span>{perspective.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={clsx('px-3 text-xs', themeClasses.emptyText[theme])}>
              No custom perspectives yet
            </p>
          )}
        </div>
      </nav>

      <div className={clsx(
        'p-4 border-t space-y-2',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-omnifocus-light-border'
      )}>
        <button
          onClick={() => setQuickEntryOpen(true)}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
            themeClasses.button[theme]
          )}
        >
          <Plus size={18} />
          <span className="text-sm">New Action</span>
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
            themeClasses.button[theme]
          )}
        >
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
}
