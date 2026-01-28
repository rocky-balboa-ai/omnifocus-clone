'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { ActionItem } from './ActionItem';
import { Flag, Plus, Search, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export function FlaggedList() {
  const { actions, isLoading, setQuickEntryOpen, setSearchOpen, showCompleted, setShowCompleted, theme } = useAppStore();

  // Filter to only flagged actions (optionally including completed)
  const flaggedActions = actions.filter(a =>
    a.flagged && (showCompleted || a.status !== 'completed')
  );

  const completedCount = actions.filter(a => a.flagged && a.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className={clsx(
        'px-4 md:px-6 py-3 md:py-4 border-b safe-area-top flex items-center justify-between gap-3',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3 flex-1">
          <Flag size={24} className="text-omnifocus-orange" />
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Flagged
          </h2>
        </div>

        {/* Show/Hide Completed toggle */}
        {completedCount > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              showCompleted
                ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
            title={showCompleted ? 'Hide completed' : 'Show completed'}
          >
            {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden md:inline">{completedCount}</span>
          </button>
        )}

        <button
          onClick={() => setSearchOpen(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
        >
          <Search size={16} />
          <kbd className={clsx(
            'hidden md:inline px-1.5 py-0.5 text-xs rounded',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white border border-gray-200'
          )}>⌘K</kbd>
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
            <Flag size={48} className={theme === 'dark' ? 'mx-auto text-gray-600 mb-4' : 'mx-auto text-gray-300 mb-4'} />
            <p className="text-gray-500">No flagged actions</p>
            <p className={clsx('text-sm mt-1', theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}>
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
