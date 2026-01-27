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
} from 'lucide-react';
import clsx from 'clsx';

const iconMap: Record<string, React.ReactNode> = {
  inbox: <Inbox size={18} />,
  folder: <FolderKanban size={18} />,
  tag: <Tags size={18} />,
  calendar: <Calendar size={18} />,
  flag: <Flag size={18} />,
  refresh: <RefreshCw size={18} />,
};

export function Sidebar() {
  const { perspectives, currentPerspective, setCurrentPerspective, setQuickEntryOpen, openPerspectiveEditor } = useAppStore();

  const builtInPerspectives = perspectives.filter((p) => p.isBuiltIn);
  const customPerspectives = perspectives.filter((p) => !p.isBuiltIn);

  return (
    <aside className="hidden md:flex w-64 bg-omnifocus-sidebar border-r border-omnifocus-border flex-col">
      <div className="p-4">
        <h1 className="text-xl font-semibold text-white">OmniFocus</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {builtInPerspectives.map((perspective) => (
            <button
              key={perspective.id}
              onClick={() => setCurrentPerspective(perspective.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                currentPerspective === perspective.id
                  ? 'bg-omnifocus-purple text-white'
                  : 'text-gray-400 hover:bg-omnifocus-surface hover:text-white'
              )}
            >
              {iconMap[perspective.icon || 'inbox']}
              <span>{perspective.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Custom
            </h3>
            <button
              onClick={() => openPerspectiveEditor()}
              className="p-1 rounded hover:bg-omnifocus-surface text-gray-500 hover:text-white transition-colors"
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
                      ? 'bg-omnifocus-purple text-white'
                      : 'text-gray-400 hover:bg-omnifocus-surface hover:text-white'
                  )}
                >
                  <FolderKanban size={18} />
                  <span>{perspective.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 text-xs text-gray-600">
              No custom perspectives yet
            </p>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-omnifocus-border">
        <button
          onClick={() => setQuickEntryOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={18} />
          <span className="text-sm">New Action</span>
        </button>
      </div>
    </aside>
  );
}
