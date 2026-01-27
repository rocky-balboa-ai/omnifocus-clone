'use client';

import { useAppStore } from '@/stores/app.store';
import { ActionItem } from './ActionItem';
import { Flag, Plus, Search } from 'lucide-react';

export function FlaggedList() {
  const { actions, isLoading, setQuickEntryOpen, setSearchOpen } = useAppStore();

  // Filter to only flagged, active actions
  const flaggedActions = actions.filter(a => a.flagged && a.status !== 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-omnifocus-border safe-area-top flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Flag size={24} className="text-omnifocus-orange" />
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Flagged
          </h2>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border transition-colors text-sm"
        >
          <Search size={16} />
          <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-omnifocus-bg rounded">⌘K</kbd>
        </button>

        <button
          onClick={() => setQuickEntryOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Action</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {flaggedActions.length === 0 ? (
          <div className="text-center py-12">
            <Flag size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No flagged actions</p>
            <p className="text-sm text-gray-600 mt-1">
              Flag important actions to see them here
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {flaggedActions.map(action => (
              <ActionItem key={action.id} action={action} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
