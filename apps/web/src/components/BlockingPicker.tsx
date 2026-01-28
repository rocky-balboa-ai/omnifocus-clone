'use client';

import { useAppStore } from '@/stores/app.store';
import { X, Link } from 'lucide-react';
import clsx from 'clsx';

interface BlockingPickerProps {
  actionId: string;
  onClose: () => void;
}

export function BlockingPicker({ actionId, onClose }: BlockingPickerProps) {
  const { actions, updateAction, theme } = useAppStore();

  const currentAction = actions.find((a) => a.id === actionId);
  const currentBlockedBy = currentAction?.blockedBy || [];

  // Get all other active actions (not the current one)
  const availableActions = actions.filter(
    (a) => a.id !== actionId && a.status === 'active'
  );

  const handleToggle = async (targetId: string) => {
    const isCurrentlyBlocking = currentBlockedBy.includes(targetId);
    const newBlockedBy = isCurrentlyBlocking
      ? currentBlockedBy.filter((id) => id !== targetId)
      : [...currentBlockedBy, targetId];

    await updateAction(actionId, { blockedBy: newBlockedBy });
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50'
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          'w-full max-w-md rounded-xl shadow-xl',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-white'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Link size={18} className="text-omnifocus-purple" />
            <h2 className={clsx(
              'text-lg font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Blocked By
            </h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-border text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <div className={clsx(
          'px-4 py-2 text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          Select tasks that must be completed before this task becomes available.
        </div>

        {/* Action list */}
        <div className="max-h-64 overflow-y-auto px-4 pb-4">
          {availableActions.length === 0 ? (
            <p className={clsx(
              'text-center py-8',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              No other active tasks available
            </p>
          ) : (
            <ul className="space-y-1">
              {availableActions.map((action) => {
                const isBlocking = currentBlockedBy.includes(action.id);
                return (
                  <li key={action.id}>
                    <label
                      className={clsx(
                        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        theme === 'dark'
                          ? 'hover:bg-omnifocus-bg'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isBlocking}
                        onChange={() => handleToggle(action.id)}
                        aria-label={action.title}
                        className="w-4 h-4 rounded border-gray-400 text-omnifocus-purple focus:ring-omnifocus-purple"
                      />
                      <span className={clsx(
                        'text-sm',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {action.title}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
